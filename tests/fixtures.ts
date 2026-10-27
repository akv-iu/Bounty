import type { PlanRequest } from "../src/planner";

export function fixture(): PlanRequest {
  return {
    schemaVersion: 1, scenarioId: "contract-fixture", startUtc: "2026-07-01T00:00:00Z",
    intervalHours: 1, objective: "carbon",
    provenance: { mode: "synthetic", preparedAt: "2026-10-27T00:00:00Z", prices: "synthetic", capacity: "synthetic", jobs: "synthetic", priceSeed: 4271 },
    regions: ["CISO", "ERCO", "MISO", "PACE", "PJM"].map(id => ({
      id, name: id, timeZone: "UTC", carbonGPerKwh: Array(24).fill(400),
      priceUsdPerMwh: Array(24).fill(100), availableGpus: Array(24).fill(32),
      carbonSource: { kind: "synthetic", label: "Test control", url: null, sha256: null },
    })),
    jobs: [{ id: "eval-1", homeRegionId: "CISO", eligibleRegionIds: ["CISO", "ERCO"], releaseSlot: 0, deadlineSlot: 24, durationSlots: 2, gpus: 16, facilityPowerKw: 100 }],
  };
}
