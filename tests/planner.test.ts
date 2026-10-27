import { describe, expect, it } from "vitest";
import { planScenario, ScenarioArithmeticError, ScenarioValidationError } from "../src/planner";
import type { PlanRequest } from "../src/planner";
import { fixture } from "./fixtures";

function pinned(): PlanRequest {
  const request = fixture();
  request.jobs[0].eligibleRegionIds = ["CISO"];
  request.jobs[0].deadlineSlot = 2;
  return request;
}

describe("whole-window scheduling", () => {
  it("accounts for facility power exactly once, with explicit units", () => {
    const result = planScenario(pinned());
    for (const policy of Object.values(result.policies)) {
      expect(policy.totals).toEqual({ energyKwh: 200, costUsd: 20, carbonKg: 80 });
      expect(policy.assignments[0]).toMatchObject({ jobId: "eval-1", regionId: "CISO", startSlot: 0, endSlot: 2 });
      expect(policy.counts).toEqual({ submitted: 1, planned: 1, unplaced: 0 });
    }
  });
  it("sums changing hourly signals rather than using only the first hour", () => {
    const request = pinned();
    request.regions[0].priceUsdPerMwh.splice(0, 2, 50, 150);
    request.regions[0].carbonGPerKwh.splice(0, 2, 200, 600);
    expect(planScenario(request).policies.regionAndTime.totals).toEqual({ energyKwh: 200, costUsd: 20, carbonKg: 80 });
  });
  it("finishes at the exact deadline and never starts before release", () => {
    const request = pinned(); request.jobs[0].releaseSlot = 22; request.jobs[0].deadlineSlot = 24;
    expect(planScenario(request).policies.regionAndTime.assignments[0]).toMatchObject({ startSlot: 22, endSlot: 24 });
  });
  it("requires GPU capacity for every occupied hour", () => {
    const request = pinned(); request.jobs[0].deadlineSlot = 4; request.regions[0].availableGpus[1] = 0;
    expect(planScenario(request).policies.regionAndTime.assignments[0]).toMatchObject({ startSlot: 2, endSlot: 4 });
  });
  it.each(["carbonGPerKwh", "priceUsdPerMwh"] as const)("does not zero-fill missing %s", key => {
    const request = pinned(); request.regions[0][key][1] = null;
    expect(planScenario(request).policies.regionAndTime.unplaced).toEqual([{ jobId: "eval-1", reason: "NO_FEASIBLE_WINDOW" }]);
  });
  it("honors excluded home in both baseline policies", () => {
    const request = pinned(); request.jobs[0].eligibleRegionIds = ["ERCO"];
    const result = planScenario(request);
    expect(result.policies.earliestHome.unplaced[0].reason).toBe("NO_ELIGIBLE_REGION");
    expect(result.policies.waitHome.unplaced[0].reason).toBe("NO_ELIGIBLE_REGION");
    expect(result.policies.regionAndTime.assignments[0].regionId).toBe("ERCO");
  });
  it("distinguishes an empty eligible set, a short window and unavailable capacity", () => {
    const request = pinned(); request.jobs[0].eligibleRegionIds = []; request.jobs[0].durationSlots = 3;
    expect(planScenario(request).policies.regionAndTime.unplaced[0].reason).toBe("NO_ELIGIBLE_REGION");
    request.jobs[0].eligibleRegionIds = ["CISO"];
    expect(planScenario(request).policies.regionAndTime.unplaced[0].reason).toBe("WINDOW_TOO_SHORT");
    request.jobs[0].durationSlots = 2; request.jobs[0].gpus = 99;
    expect(planScenario(request).policies.regionAndTime.unplaced[0].reason).toBe("NO_FEASIBLE_WINDOW");
  });
  it("rejects malformed requests at the public entry with field issues", () => {
    const request = pinned(); request.jobs[0].gpus = 0;
    expect(() => planScenario(request)).toThrow(ScenarioValidationError);
    try { planScenario(request); } catch (error) {
      expect((error as ScenarioValidationError).issues).toContainEqual(expect.objectContaining({ path: "jobs[0].gpus" }));
    }
  });
  it("aborts candidate arithmetic overflow instead of returning a partial plan", () => {
    const request = pinned(); request.jobs[0].facilityPowerKw = Number.MAX_VALUE;
    expect(() => planScenario(request)).toThrow(ScenarioArithmeticError);
    try { planScenario(request); } catch (error) {
      expect(error).toMatchObject({ name: "ScenarioArithmeticError", code: "NONFINITE_ARITHMETIC", path: expect.stringContaining("energyKwh") });
    }
  });
  it("checks feasibility before evaluating huge numeric inputs", () => {
    const request = pinned(); request.jobs[0].facilityPowerKw = Number.MAX_VALUE; request.jobs[0].gpus = 99;
    expect(planScenario(request).policies.regionAndTime.counts.unplaced).toBe(1);
  });
  it("rejects overflow in a feasible alternative even when a safe winner exists", () => {
    const request = fixture(); request.jobs[0].deadlineSlot = 2; request.jobs[0].facilityPowerKw = 1000;
    request.regions[1].priceUsdPerMwh.fill(1e308);
    expect(() => planScenario(request)).toThrow(ScenarioArithmeticError);
    try { planScenario(request); } catch (error) {
      expect((error as ScenarioArithmeticError).path).toContain("costUsd");
    }
  });
  it("aborts a policy sum overflowing even when each job total is finite", () => {
    const request = pinned(); request.jobs[0].durationSlots = 1; request.jobs[0].facilityPowerKw = 1e308;
    request.jobs.push({ ...request.jobs[0], id: "second" });
    expect(() => planScenario(request)).toThrow(ScenarioArithmeticError);
    try { planScenario(request); } catch (error) {
      expect((error as ScenarioArithmeticError).path).toBe("policies.earliestHome.totals.energyKwh");
    }
  });
});

describe("policy choices, reservations and truthful comparisons", () => {
  it("separates waiting at home from geographic routing", () => {
    const request = fixture(); request.jobs[0].durationSlots = 1; request.jobs[0].deadlineSlot = 2;
    request.regions[0].carbonGPerKwh.splice(0, 2, 400, 200);
    request.regions[1].carbonGPerKwh.splice(0, 2, 100, 300);
    const result = planScenario(request);
    expect(result.policies.earliestHome.assignments[0]).toMatchObject({ regionId: "CISO", startSlot: 0, carbonKg: 40 });
    expect(result.policies.waitHome.assignments[0]).toMatchObject({ regionId: "CISO", startSlot: 1, carbonKg: 20 });
    expect(result.policies.regionAndTime.assignments[0]).toMatchObject({ regionId: "ERCO", startSlot: 0, carbonKg: 10 });
    expect(result.comparison).toMatchObject({ referencePolicy: "waitHome", comparable: true, reason: null, savings: { carbonKg: 10, carbonPercent: 50, costUsd: 0, costPercent: 0 } });
  });
  it("changes objective with a real carbon versus cost tradeoff and retains signed deltas", () => {
    const request = fixture(); request.jobs[0].deadlineSlot = 2;
    request.regions[1].carbonGPerKwh.fill(100); request.regions[1].priceUsdPerMwh.fill(200);
    const carbon = planScenario(request);
    expect(carbon.policies.regionAndTime.assignments[0].regionId).toBe("ERCO");
    expect(carbon.comparison.savings).toEqual({ costUsd: -20, costPercent: -100, carbonKg: 60, carbonPercent: 75 });
    request.objective = "cost";
    expect(planScenario(request).policies.regionAndTime.assignments[0].regionId).toBe("CISO");
  });
  it("uses the secondary objective before time and region ID", () => {
    const request = fixture(); request.jobs[0].deadlineSlot = 2;
    request.regions[1].priceUsdPerMwh.fill(50);
    expect(planScenario(request).policies.regionAndTime.assignments[0].regionId).toBe("ERCO");
    request.objective = "cost"; request.regions[1].priceUsdPerMwh.fill(100); request.regions[1].carbonGPerKwh.fill(100);
    expect(planScenario(request).policies.regionAndTime.assignments[0].regionId).toBe("ERCO");
  });
  it("breaks objective ties by earlier start, then region code-point order", () => {
    const request = fixture(); request.jobs[0].durationSlots = 1; request.jobs[0].deadlineSlot = 2;
    request.regions[0].carbonGPerKwh.splice(0, 2, 400, 100); request.regions[1].carbonGPerKwh.fill(100);
    expect(planScenario(request).policies.regionAndTime.assignments[0]).toMatchObject({ regionId: "ERCO", startSlot: 0 });
    request.regions[0].carbonGPerKwh[0] = 100; request.regions.reverse(); request.jobs[0].eligibleRegionIds.reverse();
    expect(planScenario(request).policies.regionAndTime.assignments[0]).toMatchObject({ regionId: "CISO", startSlot: 0 });
  });
  it("orders jobs by release, deadline and ID independently of input order", () => {
    const request = pinned();
    request.jobs = [
      { ...request.jobs[0], id: "late", releaseSlot: 2, deadlineSlot: 4 },
      { ...request.jobs[0], id: "z", deadlineSlot: 3 },
      { ...request.jobs[0], id: "b", deadlineSlot: 2 },
      { ...request.jobs[0], id: "a", deadlineSlot: 2 },
    ];
    const result = planScenario(request).policies.regionAndTime;
    expect(result.assignments.map(a => a.jobId)).toEqual(["a", "b", "late"]);
    expect(result.unplaced).toEqual([{ jobId: "z", reason: "NO_FEASIBLE_WINDOW" }]);
  });
  it("reserves all hours, permits concurrency and uses independent capacity per policy", () => {
    const request = pinned();
    request.jobs.push({ ...request.jobs[0], id: "eval-2" }, { ...request.jobs[0], id: "eval-3" });
    for (const policy of Object.values(planScenario(request).policies)) {
      expect(policy.assignments.map(a => a.jobId)).toEqual(["eval-1", "eval-2"]);
      expect(policy.unplaced).toEqual([{ jobId: "eval-3", reason: "NO_FEASIBLE_WINDOW" }]);
      expect(policy.totals).toEqual({ energyKwh: 400, costUsd: 40, carbonKg: 160 });
    }
  });
  it("preserves alternatives available at the job's decision, before its reservation", () => {
    const request = pinned(); request.regions[0].availableGpus.fill(16); request.jobs[0].deadlineSlot = 4;
    request.jobs.push({ ...request.jobs[0], id: "eval-2" });
    const assignments = planScenario(request).policies.regionAndTime.assignments;
    expect(assignments[0].alternatives.map(c => c.startSlot)).toEqual([0, 1, 2]);
    expect(assignments[1].alternatives.map(c => c.startSlot)).toEqual([2]);
    expect(assignments[0].alternatives[0]).toEqual({ regionId: "CISO", startSlot: 0, endSlot: 2, energyKwh: 200, costUsd: 20, carbonKg: 80 });
  });
  it("normalizes negative-zero start times without changing input", () => {
    const request = fixture(); request.jobs[0].releaseSlot = -0;
    const result = planScenario(request);
    for (const policy of Object.values(result.policies)) {
      expect(policy.assignments[0].startSlot).toBe(0);
      expect(policy.assignments[0].alternatives[0].startSlot).toBe(0);
    }
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(Object.is(request.jobs[0].releaseSlot, -0)).toBe(true);
  });
  it("preserves input and repeated-call results without shared policy outputs", () => {
    const request = fixture(); const before = structuredClone(request);
    const result = planScenario(request);
    expect(request).toEqual(before); expect(planScenario(request)).toEqual(result);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    result.policies.earliestHome.assignments[0].alternatives[0].carbonKg = 999;
    expect(result.policies.waitHome.assignments[0].alternatives[0].carbonKg).toBe(80);
    expect(planScenario(request).policies.earliestHome.assignments[0].alternatives[0].carbonKg).toBe(80);
  });
  it("exposes greedy rejection without claiming global infeasibility or false savings", () => {
    const request = fixture(); request.jobs[0].durationSlots = 1; request.jobs[0].deadlineSlot = 1; request.jobs[0].gpus = 32; request.jobs[0].id = "a-flexible";
    request.regions[1].carbonGPerKwh.fill(100);
    request.jobs.push({ ...request.jobs[0], id: "b-pinned", homeRegionId: "ERCO", eligibleRegionIds: ["ERCO"] });
    const result = planScenario(request);
    expect(result.policies.waitHome.counts.planned).toBe(2);
    expect(result.policies.regionAndTime.assignments[0].regionId).toBe("ERCO");
    expect(result.policies.regionAndTime.unplaced).toEqual([{ jobId: "b-pinned", reason: "NO_FEASIBLE_WINDOW" }]);
    expect(result.comparison).toMatchObject({ comparable: false, reason: "DIFFERENT_COMPLETED_JOBS", savings: { costUsd: null, carbonKg: null, costPercent: null, carbonPercent: null } });
    expect(result.comparison.completedJobIds.waitHome).toEqual(["a-flexible", "b-pinned"]);
  });
  it("requires matching IDs, not just matching completion counts", () => {
    const different = fixture(); different.jobs[0].durationSlots = 1; different.jobs[0].deadlineSlot = 1; different.jobs[0].gpus = 32;
    different.jobs[0].id = "a"; different.jobs[0].eligibleRegionIds = ["ERCO"];
    different.jobs.push({ ...different.jobs[0], id: "b", homeRegionId: "ERCO" });
    const outcome = planScenario(different);
    expect(outcome.policies.waitHome.counts.planned).toBe(1); expect(outcome.policies.regionAndTime.counts.planned).toBe(1);
    expect(outcome.comparison.completedJobIds.waitHome).toEqual(["b"]);
    expect(outcome.comparison.completedJobIds.regionAndTime).toEqual(["a"]);
    expect(outcome.comparison.reason).toBe("DIFFERENT_COMPLETED_JOBS");
  });
  it("suppresses savings when earliest-home differs even if the optimizing policies match", () => {
    const request = pinned(); request.jobs[0].durationSlots = 1; request.jobs[0].deadlineSlot = 3; request.jobs[0].gpus = 32;
    request.regions[0].carbonGPerKwh[1] = 100;
    request.jobs.push({ ...request.jobs[0], id: "later", releaseSlot: 1, durationSlots: 2 });
    const result = planScenario(request);
    expect(result.policies.earliestHome.counts.planned).toBe(2);
    expect(result.policies.waitHome.counts.planned).toBe(1);
    expect(result.policies.regionAndTime.counts.planned).toBe(1);
    expect(result.comparison).toMatchObject({ comparable: false, reason: "DIFFERENT_COMPLETED_JOBS", savings: { costUsd: null, carbonKg: null, costPercent: null, carbonPercent: null } });
  });
  it.each([0, -100])("does not report a savings percentage for reference price %s", price => {
    const request = fixture(); request.jobs[0].deadlineSlot = 2; request.objective = "cost";
    request.regions[0].priceUsdPerMwh.fill(price); request.regions[1].priceUsdPerMwh.fill(price - 100);
    expect(planScenario(request).comparison.savings).toMatchObject({ costUsd: 20, costPercent: null });
  });
  it.each([0, -100])("does not report a savings percentage for reference carbon %s", carbon => {
    const request = fixture(); request.jobs[0].deadlineSlot = 2;
    request.regions[0].carbonGPerKwh.fill(carbon); request.regions[1].carbonGPerKwh.fill(carbon - 100);
    expect(planScenario(request).comparison.savings).toMatchObject({ carbonKg: 20, carbonPercent: null });
  });
  it("returns no-completed-work for empty and all-unplaced batches", () => {
    const request = fixture(); request.jobs = [];
    const empty = planScenario(request);
    expect(empty.comparison).toMatchObject({ comparable: false, reason: "NO_COMPLETED_WORK", savings: { costUsd: null, carbonKg: null, costPercent: null, carbonPercent: null } });
    const saturated = pinned(); saturated.regions[0].availableGpus.fill(0);
    expect(planScenario(saturated).comparison.reason).toBe("NO_COMPLETED_WORK");
  });
  it.each(["difference", "percentage"])("aborts comparison %s overflow", kind => {
    const request = fixture(); request.jobs[0].durationSlots = 1; request.jobs[0].deadlineSlot = 1; request.jobs[0].facilityPowerKw = 1000; request.objective = "cost";
    request.regions[0].priceUsdPerMwh.fill(kind === "difference" ? 1e308 : 1e-300);
    request.regions[1].priceUsdPerMwh.fill(kind === "difference" ? -1e308 : -1e100);
    expect(() => planScenario(request)).toThrow(ScenarioArithmeticError);
    try { planScenario(request); } catch (error) {
      expect((error as ScenarioArithmeticError).path).toBe(`comparison.savings.${kind === "difference" ? "costUsd" : "costPercent"}`);
    }
  });
});
