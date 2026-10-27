const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { planScenario } = require('../dist/planner/index.js');
const snapshot = JSON.parse(readFileSync(path.join(__dirname, '../data/scenario.json'), 'utf8'));
const cases = [];

for (const capacity of [30, 0]) {
  const request = structuredClone(snapshot);
  const ids = request.regions.map(r => r.id).sort();
  request.scenarioId = `benchmark-${capacity ? 'feasible' : 'saturated'}`;
  for (const region of request.regions) region.availableGpus.fill(capacity);
  request.jobs = Array.from({ length: 30 }, (_, i) => ({ id: `job-${String(i).padStart(2, '0')}`, homeRegionId: ids[i % 5], eligibleRegionIds: [...ids], releaseSlot: 0, deadlineSlot: 24, durationSlots: 2, gpus: 1, facilityPowerKw: 1 }));
  const expected = capacity ? 30 : 0;
  const proof = planScenario(request);
  for (const policy of Object.values(proof.policies)) assert.equal(policy.counts.planned, expected);
  for (let i = 0; i < 20; i++) planScenario(request);
  const samplesMs = [];
  for (let i = 0; i < 200; i++) {
    const start = performance.now();
    planScenario(request);
    samplesMs.push(performance.now() - start);
  }
  const sorted = [...samplesMs].sort((a, b) => a - b);
  cases.push({ name: request.scenarioId, regions: 5, slots: 24, jobs: 30, warmups: 20, samples: 200, p50Ms: sorted[99], p95Ms: sorted[189], maxMs: sorted[199], samplesMs, request });
}
const report = { measuredAt: new Date().toISOString(), runtime: process.version, platform: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryGiB: Math.round(os.totalmem() / 2 ** 30), scope: 'validation and all three policies; Node only', budgetP95Ms: 50, passed: cases.every(c => c.p95Ms <= 50), cases };
const destination = path.join(__dirname, '../docs/benchmarks/p2-node.json');
mkdirSync(path.dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
for (const c of cases) console.log(`${c.name}: p50=${c.p50Ms.toFixed(3)} ms, p95=${c.p95Ms.toFixed(3)} ms, max=${c.maxMs.toFixed(3)} ms`);
console.log(`Recorded inputs, all samples and environment in ${destination}`);
assert.equal(report.passed, true, 'Planner exceeded the 50 ms p95 budget');
