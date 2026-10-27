import type { PlanResult, PolicyResult } from "../src/planner";

// Hand-worked contract illustration, not output from an implemented scheduler.
// One eligible CISO job: 100 kW, 2 h, flat 100 USD/MWh and 400 g/kWh.
const policy: PolicyResult = {
  assignments: [{ jobId: "example", regionId: "CISO", startSlot: 0, endSlot: 2,
    energyKwh: 200, costUsd: 20, carbonKg: 80,
    alternatives: [{ regionId: "CISO", startSlot: 0, endSlot: 2, energyKwh: 200, costUsd: 20, carbonKg: 80 }],
  }],
  unplaced: [], counts: { submitted: 1, planned: 1, unplaced: 0 },
  totals: { energyKwh: 200, costUsd: 20, carbonKg: 80 },
};

export const resultShape: PlanResult = {
  schemaVersion: 1, scenarioId: "hand-worked-contract-example", objective: "carbon",
  policies: { earliestHome: structuredClone(policy), waitHome: structuredClone(policy), regionAndTime: structuredClone(policy) },
  comparison: {
    referencePolicy: "waitHome", chosenPolicy: "regionAndTime",
    completedJobIds: { earliestHome: ["example"], waitHome: ["example"], regionAndTime: ["example"] },
    comparable: true, reason: null,
    savings: { costUsd: 0, carbonKg: 0, costPercent: 0, carbonPercent: 0 },
  },
};
