import type { ArithmeticFailure, Candidate, PlanRequest, PlanResult, PolicyId, PolicyResult, ValidationIssue } from "./types.ts";
import { validateScenario } from "./validate.ts";

export class ScenarioValidationError extends Error {
  readonly name = "ScenarioValidationError";
  constructor(readonly issues: ValidationIssue[]) {
    super(`Invalid scenario: ${issues.map(issue => `${issue.path}: ${issue.reason}`).join("; ")}`);
  }
}

export class ScenarioArithmeticError extends Error implements ArithmeticFailure {
  readonly name = "ScenarioArithmeticError";
  readonly code = "NONFINITE_ARITHMETIC";
  constructor(readonly path: string) { super(`Nonfinite arithmetic at ${path}`); }
}

function checked(value: number, path: string): number {
  if (!Number.isFinite(value)) throw new ScenarioArithmeticError(path);
  return value === 0 ? 0 : value;
}

function compareIds(a: string, b: string): number {
  const left = [...a], right = [...b];
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const difference = left[i].codePointAt(0)! - right[i].codePointAt(0)!;
    if (difference) return difference;
  }
  return left.length - right.length;
}

function compareNumbers(a: number, b: number): number { return a === b ? 0 : a < b ? -1 : 1; }

function runPolicy(request: PlanRequest, policyId: PolicyId): PolicyResult {
  const regions = [...request.regions].sort((a, b) => compareIds(a.id, b.id));
  const remaining = new Map(regions.map(region => [region.id, [...region.availableGpus]]));
  const jobs = [...request.jobs].sort((a, b) => a.releaseSlot - b.releaseSlot || a.deadlineSlot - b.deadlineSlot || compareIds(a.id, b.id));
  const result: PolicyResult = { assignments: [], unplaced: [], counts: { submitted: jobs.length, planned: 0, unplaced: 0 }, totals: { energyKwh: 0, costUsd: 0, carbonKg: 0 } };
  for (const [jobIndex, job] of jobs.entries()) {
    const eligible = regions.filter(region => job.eligibleRegionIds.includes(region.id) && (policyId === "regionAndTime" || region.id === job.homeRegionId));
    if (!eligible.length) { result.unplaced.push({ jobId: job.id, reason: "NO_ELIGIBLE_REGION" }); continue; }
    if (job.durationSlots > job.deadlineSlot - job.releaseSlot) { result.unplaced.push({ jobId: job.id, reason: "WINDOW_TOO_SHORT" }); continue; }
    const candidates: Candidate[] = [];
    for (const region of eligible) {
      const capacity = remaining.get(region.id)!;
      for (let start = job.releaseSlot; start + job.durationSlots <= job.deadlineSlot; start++) {
        const end = start + job.durationSlots;
        let feasible = true;
        for (let hour = start; hour < end; hour++) {
          if (capacity[hour] < job.gpus || region.carbonGPerKwh[hour] === null || region.priceUsdPerMwh[hour] === null) { feasible = false; break; }
        }
        if (!feasible) continue;
        const path = `policies.${policyId}.decisions[${jobIndex}].candidates[${candidates.length}]`;
        const candidate: Candidate = { regionId: region.id, startSlot: start === 0 ? 0 : start, endSlot: end, energyKwh: 0, costUsd: 0, carbonKg: 0 };
        for (let hour = start; hour < end; hour++) {
          const energy = job.facilityPowerKw * request.intervalHours;
          candidate.energyKwh = checked(candidate.energyKwh + energy, `${path}.energyKwh`);
          candidate.costUsd = checked(candidate.costUsd + energy * (region.priceUsdPerMwh[hour]! / 1000), `${path}.costUsd`);
          candidate.carbonKg = checked(candidate.carbonKg + energy * (region.carbonGPerKwh[hour]! / 1000), `${path}.carbonKg`);
        }
        candidates.push(candidate);
      }
    }
    if (!candidates.length) { result.unplaced.push({ jobId: job.id, reason: "NO_FEASIBLE_WINDOW" }); continue; }
    const primary = request.objective === "carbon" ? "carbonKg" : "costUsd";
    const secondary = request.objective === "carbon" ? "costUsd" : "carbonKg";
    candidates.sort((a, b) => {
      if (policyId !== "earliestHome") {
        const objectiveOrder = compareNumbers(a[primary], b[primary]) || compareNumbers(a[secondary], b[secondary]);
        if (objectiveOrder) return objectiveOrder;
      }
      return a.startSlot - b.startSlot || compareIds(a.regionId, b.regionId);
    });
    const chosen = candidates[0];
    result.assignments.push({ ...chosen, jobId: job.id, alternatives: candidates });
    const capacity = remaining.get(chosen.regionId)!;
    for (let hour = chosen.startSlot; hour < chosen.endSlot; hour++) capacity[hour] -= job.gpus;
    for (const key of ["energyKwh", "costUsd", "carbonKg"] as const) result.totals[key] = checked(result.totals[key] + chosen[key], `policies.${policyId}.totals.${key}`);
  }
  result.counts.planned = result.assignments.length;
  result.counts.unplaced = result.unplaced.length;
  return result;
}

function comparePolicies(policies: PlanResult["policies"]): PlanResult["comparison"] {
  const completed = (policy: PolicyResult) => policy.assignments.map(a => a.jobId).sort(compareIds);
  const completedJobIds = { earliestHome: completed(policies.earliestHome), waitHome: completed(policies.waitHome), regionAndTime: completed(policies.regionAndTime) };
  const chosenIds = completedJobIds.regionAndTime;
  const noWork = Object.values(completedJobIds).every(ids => ids.length === 0);
  const sameWork = Object.values(completedJobIds).every(ids => ids.length === chosenIds.length && ids.every((id, i) => id === chosenIds[i]));
  const reason = noWork ? "NO_COMPLETED_WORK" : sameWork ? null : "DIFFERENT_COMPLETED_JOBS";
  const savings: PlanResult["comparison"]["savings"] = { costUsd: null, carbonKg: null, costPercent: null, carbonPercent: null };
  if (reason === null) {
    const reference = policies.waitHome.totals, chosen = policies.regionAndTime.totals;
    savings.costUsd = checked(reference.costUsd - chosen.costUsd, "comparison.savings.costUsd");
    savings.carbonKg = checked(reference.carbonKg - chosen.carbonKg, "comparison.savings.carbonKg");
    if (reference.costUsd > 0) savings.costPercent = checked(savings.costUsd / reference.costUsd * 100, "comparison.savings.costPercent");
    if (reference.carbonKg > 0) savings.carbonPercent = checked(savings.carbonKg / reference.carbonKg * 100, "comparison.savings.carbonPercent");
  }
  return { referencePolicy: "waitHome", chosenPolicy: "regionAndTime", completedJobIds, comparable: reason === null, reason, savings };
}

export function planScenario(request: PlanRequest): PlanResult {
  const validation = validateScenario(request);
  if (!validation.ok) throw new ScenarioValidationError(validation.issues);
  const input = validation.value;
  const policies = {
    earliestHome: runPolicy(input, "earliestHome"),
    waitHome: runPolicy(input, "waitHome"),
    regionAndTime: runPolicy(input, "regionAndTime"),
  };
  return { schemaVersion: 1, scenarioId: input.scenarioId, objective: input.objective, policies,
    comparison: comparePolicies(policies),
  };
}
