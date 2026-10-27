import type { PlanRequest, ValidationIssue, ValidationResult } from "./types";

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function httpsUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function utcTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || +match[2] > 23 || +match[3] > 59 || +match[4] > 59) return null;
  const calendar = new Date(`${match[1]}T00:00:00Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== match[1]) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function validateScenario(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const check = (condition: boolean, path: string, reason: string) => {
    if (!condition) issues.push({ path, reason });
  };
  const object = (input: unknown, path: string, keys: string[]): Record<string, unknown> | null => {
    if (input === null || typeof input !== "object" || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
      issues.push({ path, reason: "Expected a plain JSON object" }); return null;
    }
    const record = input as Record<string, unknown>;
    for (const key of keys) check(Object.hasOwn(record, key), `${path}.${key}`, "Required field");
    for (const key of Object.keys(record)) check(keys.includes(key), `${path}.${key}`, "Unknown field in version 1");
    return record;
  };
  const text = (input: unknown, path: string) => check(typeof input === "string" && input.trim().length > 0, path, "Expected a nonempty string");
  const integer = (input: unknown, path: string, min: number, max = Number.MAX_SAFE_INTEGER) =>
    check(typeof input === "number" && Number.isSafeInteger(input) && input >= min && input <= max, path, `Expected integer ${min}..${max}`);
  const root = object(value, "$", ["schemaVersion", "scenarioId", "startUtc", "intervalHours", "objective", "provenance", "regions", "jobs"]);
  if (!root) return { ok: false, issues };
  check(root.schemaVersion === 1, "schemaVersion", "Only version 1 is supported");
  text(root.scenarioId, "scenarioId");
  const startUtc = utcTimestamp(root.startUtc);
  check(startUtc !== null, "startUtc", "Expected a valid timestamp with seconds and explicit UTC offset");
  check(root.intervalHours === 1, "intervalHours", "Expected one-hour intervals");
  check(root.objective === "carbon" || root.objective === "cost", "objective", "Expected carbon or cost");
  const provenance = object(root.provenance, "provenance", ["mode", "preparedAt", "prices", "capacity", "jobs", "priceSeed"]);
  if (provenance) {
    check(provenance.mode === "historical" || provenance.mode === "synthetic", "provenance.mode", "Expected historical or synthetic");
    check(utcTimestamp(provenance.preparedAt) !== null, "provenance.preparedAt", "Expected a timestamp with explicit offset");
    for (const key of ["prices", "capacity", "jobs"]) check(provenance[key] === "synthetic", `provenance.${key}`, "Demo version 1 requires synthetic classification");
    integer(provenance.priceSeed, "provenance.priceSeed", 0, 0xffffffff);
  }
  const regionIds = new Set<string>();
  check(Array.isArray(root.regions) && root.regions.length === 5, "regions", "Expected exactly five regions");
  if (Array.isArray(root.regions)) for (const [i, input] of root.regions.entries()) {
    const path = `regions[${i}]`;
    const region = object(input, path, ["id", "name", "timeZone", "carbonGPerKwh", "priceUsdPerMwh", "availableGpus", "carbonSource"]);
    if (!region) continue;
    text(region.id, `${path}.id`); text(region.name, `${path}.name`);
    if (typeof region.id === "string") {
      check(!regionIds.has(region.id), `${path}.id`, "Duplicate region ID"); regionIds.add(region.id);
    }
    let validZone = false;
    if (typeof region.timeZone === "string") try { new Intl.DateTimeFormat("en", { timeZone: region.timeZone }); validZone = true; } catch { /* invalid zone */ }
    check(validZone, `${path}.timeZone`, "Expected a supported IANA display timezone");
    for (const key of ["carbonGPerKwh", "priceUsdPerMwh", "availableGpus"]) {
      const values = region[key];
      check(Array.isArray(values) && values.length === 24, `${path}.${key}`, "Expected 24 hourly values");
      if (Array.isArray(values)) for (const [slot, signal] of values.entries()) {
        if (key === "availableGpus") integer(signal, `${path}.${key}[${slot}]`, 0);
        else check(signal === null || finite(signal), `${path}.${key}[${slot}]`, "Expected a finite number or explicit null");
      }
    }
    const source = object(region.carbonSource, `${path}.carbonSource`, ["kind", "label", "url", "sha256"]);
    if (source) {
      const historical = provenance?.mode === "historical";
      check(source.kind === (historical ? "historical-estimate" : "synthetic"), `${path}.carbonSource.kind`, "Carbon classification must match scenario mode");
      text(source.label, `${path}.carbonSource.label`);
      check(historical ? httpsUrl(source.url) : source.url === null, `${path}.carbonSource.url`, "Historical data needs a valid HTTPS source URL; synthetic uses null");
      check(historical ? typeof source.sha256 === "string" && /^[a-f0-9]{64}$/.test(source.sha256) : source.sha256 === null, `${path}.carbonSource.sha256`, "Historical data needs a SHA-256; synthetic uses null");
    }
  }
  const jobIds = new Set<string>();
  check(Array.isArray(root.jobs) && root.jobs.length <= 30, "jobs", "Expected at most 30 jobs");
  if (Array.isArray(root.jobs)) for (const [i, input] of root.jobs.entries()) {
    const path = `jobs[${i}]`;
    const job = object(input, path, ["id", "homeRegionId", "eligibleRegionIds", "releaseSlot", "deadlineSlot", "durationSlots", "gpus", "facilityPowerKw"]);
    if (!job) continue;
    text(job.id, `${path}.id`);
    if (typeof job.id === "string") { check(!jobIds.has(job.id), `${path}.id`, "Duplicate job ID"); jobIds.add(job.id); }
    check(typeof job.homeRegionId === "string" && regionIds.has(job.homeRegionId), `${path}.homeRegionId`, "Unknown region ID");
    check(Array.isArray(job.eligibleRegionIds), `${path}.eligibleRegionIds`, "Expected an array");
    if (Array.isArray(job.eligibleRegionIds)) {
      const seen = new Set<string>();
      for (const [j, id] of job.eligibleRegionIds.entries()) {
        check(typeof id === "string" && regionIds.has(id), `${path}.eligibleRegionIds[${j}]`, "Unknown region ID");
        if (typeof id === "string") { check(!seen.has(id), `${path}.eligibleRegionIds[${j}]`, "Duplicate region ID"); seen.add(id); }
      }
    }
    integer(job.releaseSlot, `${path}.releaseSlot`, 0, 23); integer(job.deadlineSlot, `${path}.deadlineSlot`, 1, 24);
    check(finite(job.releaseSlot) && finite(job.deadlineSlot) && job.releaseSlot < job.deadlineSlot, `${path}.deadlineSlot`, "Deadline must follow release");
    integer(job.durationSlots, `${path}.durationSlots`, 1, 24); integer(job.gpus, `${path}.gpus`, 1);
    check(finite(job.facilityPowerKw) && job.facilityPowerKw > 0, `${path}.facilityPowerKw`, "Expected positive finite facility power in kW");
  }
  if (issues.length) return { ok: false, issues };
  const normalized = structuredClone(value) as PlanRequest;
  normalized.startUtc = startUtc!;
  normalized.provenance.preparedAt = utcTimestamp(normalized.provenance.preparedAt)!;
  return { ok: true, value: normalized };
}
