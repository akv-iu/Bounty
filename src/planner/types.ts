export type Objective = "carbon" | "cost";
export type PolicyId = "earliestHome" | "waitHome" | "regionAndTime";

export interface CarbonSource {
  kind: "historical-estimate" | "synthetic";
  label: string;
  url: string | null;
  sha256: string | null;
}

export interface Region {
  id: string;
  name: string;
  timeZone: string;
  carbonGPerKwh: (number | null)[];
  priceUsdPerMwh: (number | null)[];
  availableGpus: number[];
  carbonSource: CarbonSource;
}

export interface Job {
  id: string;
  homeRegionId: string;
  eligibleRegionIds: string[];
  releaseSlot: number;
  deadlineSlot: number;
  durationSlots: number;
  gpus: number;
  facilityPowerKw: number;
}

export interface PlanRequest {
  schemaVersion: 1;
  scenarioId: string;
  startUtc: string;
  intervalHours: 1;
  objective: Objective;
  provenance: {
    mode: "historical" | "synthetic";
    preparedAt: string;
    prices: "synthetic";
    capacity: "synthetic";
    jobs: "synthetic";
    priceSeed: number;
  };
  regions: Region[];
  jobs: Job[];
}

export interface ValidationIssue { path: string; reason: string }
export type ValidationResult =
  | { ok: true; value: PlanRequest }
  | { ok: false; issues: ValidationIssue[] };

/** P2's ScenarioArithmeticError implements this shape and aborts the entire run. */
export interface ArithmeticFailure {
  name: "ScenarioArithmeticError";
  code: "NONFINITE_ARITHMETIC";
  path: string;
}

export interface Totals { energyKwh: number; costUsd: number; carbonKg: number }
export interface Candidate extends Totals { regionId: string; startSlot: number; endSlot: number }
export interface Assignment extends Candidate {
  jobId: string;
  /** Feasible candidates before this job reserves capacity, including the chosen candidate. */
  alternatives: Candidate[];
}
export type UnplacedReason = "NO_ELIGIBLE_REGION" | "WINDOW_TOO_SHORT" | "NO_FEASIBLE_WINDOW";
export interface PolicyResult {
  assignments: Assignment[];
  unplaced: { jobId: string; reason: UnplacedReason }[];
  counts: { submitted: number; planned: number; unplaced: number };
  totals: Totals;
}
export interface PlanResult {
  schemaVersion: 1;
  scenarioId: string;
  objective: Objective;
  policies: Record<PolicyId, PolicyResult>;
  comparison: {
    referencePolicy: "waitHome";
    chosenPolicy: "regionAndTime";
    completedJobIds: Record<PolicyId, string[]>;
    comparable: boolean;
    reason: "NO_COMPLETED_WORK" | "DIFFERENT_COMPLETED_JOBS" | null;
    /** Reference minus chosen; percentages are null for nonpositive references. */
    savings: { costUsd: number | null; carbonKg: number | null; costPercent: number | null; carbonPercent: number | null };
  };
}
