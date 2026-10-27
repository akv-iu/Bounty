import { describe, expect, it } from "vitest";
import { validateScenario } from "../src/planner";
import { fixture } from "./fixtures";
import snapshot from "../data/scenario.json";

describe("version 1 request boundary", () => {
  it.each(["https://", "https:// bad", "http://example.com/data", "not-a-url"])("rejects malformed historical source URL %s", url => {
    const request = structuredClone(snapshot);
    request.regions[0].carbonSource.url = url;
    const result = validateScenario(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some(issue => issue.path === "regions[0].carbonSource.url")).toBe(true);
  });
  it("accepts the bundled Python-produced historical snapshot", () => {
    const result = validateScenario(snapshot);
    expect(result.ok).toBe(true);
    expect(snapshot.regions.flatMap(region => region.carbonGPerKwh)).toHaveLength(120);
    expect(snapshot.regions.every(region => region.carbonGPerKwh.every(value => Number.isFinite(value) && value >= 0))).toBe(true);
  });
  it("accepts a complete request without mutating it", () => {
    const request = fixture(); const before = structuredClone(request);
    const result = validateScenario(request);
    expect(result.ok).toBe(true); expect(request).toEqual(before);
    if (result.ok) expect(JSON.parse(JSON.stringify(result.value))).toEqual(result.value);
  });
  it("rejects_unsupported_schema", () => expect(validateScenario({ ...fixture(), schemaVersion: 2 }).ok).toBe(false));
  it("rejects_unknown_region", () => {
    const request = fixture(); request.jobs[0].eligibleRegionIds = ["missing"];
    const result = validateScenario(request); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some(issue => issue.path === "jobs[0].eligibleRegionIds[0]")).toBe(true);
  });
  it("rejects_bad_lengths", () => {
    const request = fixture(); request.regions[0].carbonGPerKwh.pop();
    expect(validateScenario(request).ok).toBe(false);
  });
  it.each([NaN, Infinity, -Infinity, undefined])("rejects_nonfinite_inputs %s", value => {
    const request = fixture(); (request.regions[0].carbonGPerKwh as unknown[])[0] = value;
    expect(validateScenario(request).ok).toBe(false);
  });
  it("preserves_signed_prices", () => {
    const request = fixture(); request.regions[0].priceUsdPerMwh[0] = -25;
    const result = validateScenario(request); expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.regions[0].priceUsdPerMwh[0]).toBe(-25);
  });
  it("accepts_explicit_missing_signal", () => {
    const request = fixture(); request.regions[0].carbonGPerKwh[0] = null; request.regions[1].priceUsdPerMwh[0] = null;
    expect(validateScenario(request).ok).toBe(true);
  });
  it.each(["2026-07-01T00:00:00", "2026-02-30T00:00:00Z", "invalidZ", "2026-07-01T00:00:00+99:00"])("rejects invalid timestamp %s", startUtc => {
    expect(validateScenario({ ...fixture(), startUtc }).ok).toBe(false);
  });
  it("normalizes an explicit offset without changing the caller", () => {
    const request = { ...fixture(), startUtc: "2026-06-30T20:00:00-04:00" };
    const result = validateScenario(request); expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.startUtc).toBe("2026-07-01T00:00:00.000Z");
    expect(request.startUtc).toBe("2026-06-30T20:00:00-04:00");
  });
  it("accepts deadline 24, empty jobs and valid but unplaceable jobs", () => {
    expect(validateScenario({ ...fixture(), jobs: [] }).ok).toBe(true);
    const request = fixture(); request.jobs[0].gpus = 999; request.jobs[0].eligibleRegionIds = [];
    request.jobs[0].releaseSlot = 23; request.jobs[0].durationSlots = 2;
    expect(validateScenario(request).ok).toBe(true);
    request.jobs[0].deadlineSlot = 25; expect(validateScenario(request).ok).toBe(false);
  });
  it.each([null, {}, [], "text"])("rejects malformed roots %s", value => expect(validateScenario(value).ok).toBe(false));
  it("rejects duplicates, bad counts and invalid enums", () => {
    const request = fixture(); request.regions[1].id = "CISO";
    expect(validateScenario(request).ok).toBe(false);
    expect(validateScenario({ ...fixture(), jobs: Array(31).fill(fixture().jobs[0]) }).ok).toBe(false);
    expect(validateScenario({ ...fixture(), intervalHours: 2 }).ok).toBe(false);
    expect(validateScenario({ ...fixture(), objective: "fast" }).ok).toBe(false);
  });
  it.each([0, -1, 0.5, Infinity])("rejects invalid GPU demand %s", gpus => {
    const request = fixture(); request.jobs[0].gpus = gpus; expect(validateScenario(request).ok).toBe(false);
  });
  it("rejects sparse arrays, bad zones and contradictory provenance", () => {
    const request = fixture(); delete request.regions[0].carbonGPerKwh[2];
    expect(validateScenario(request).ok).toBe(false);
    const other = fixture(); other.regions[0].timeZone = "Mars/Olympus";
    expect(validateScenario(other).ok).toBe(false);
    expect(validateScenario({ ...fixture(), provenance: { ...fixture().provenance, mode: "historical" } }).ok).toBe(false);
  });
});
