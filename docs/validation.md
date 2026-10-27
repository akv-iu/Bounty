# Implementation validation

## P2 — reusable planner, October 27, 2026

H1 was approved by the user's instruction to move to the next step. P2 is implemented on `feat/p2-planner`, based on P1 commit `f2acb29`; H2 remains required before P3. No real compute jobs are dispatched. The dashboard still shows a foundation page; the interactive map/heatmap is P3 work.

### Public behavior

Import `planScenario`, `validateScenario`, `ScenarioValidationError` and `ScenarioArithmeticError` from `src/planner/index.ts`. Request/result types remain the P1 version 1 contract. A call validates and clones the request, then runs earliest-at-home, wait-at-home and region-and-time policies with independent capacity arrays. Caller inputs, previous results and other policy outputs are not mutated.

Jobs sort by release, deadline, then Unicode code-point ID. Regions sort by code-point ID. Each job enumerates all eligible, complete, contiguous windows within its release/deadline boundaries. Every occupied slot must have enough GPUs and both carbon and price. Facility kW already includes overhead; GPU count limits capacity and is not multiplied into power. Hourly energy is facility kW × one hour; cost is energy × price/1000; carbon is energy × intensity/1000. Sum every occupied hour, preserving signed values without rounding internal totals.

Earliest-home picks the earliest feasible home window. The two optimizing policies rank whole-window totals by the requested objective, then the other objective, then earlier start and code-point region ID. Each chosen job reserves every occupied slot before processing the next job. This is deterministic greedy scheduling, not a guarantee of fleet-wide optimality or placement of every schedulable batch.

Each assignment includes every feasible candidate evaluated at that decision, including the winner, sorted by that policy's ranking. These retained alternatives explain tradeoffs without an LLM. Unplaced reason precedence is `NO_ELIGIBLE_REGION`, `WINDOW_TOO_SHORT`, then `NO_FEASIBLE_WINDOW` (capacity or missing signals under that policy's reservations). An excluded home remains ineligible for the baselines.

All three policies must complete the same nonempty job-ID set for aggregate comparisons. Equal counts alone are insufficient. Empty work gives `NO_COMPLETED_WORK`; other mismatches give `DIFFERENT_COMPLETED_JOBS`; all savings are null in both cases. Otherwise savings are wait-home minus region-and-time, preserving negative deltas. Percentage is null for a nonpositive reference total. Returned output is finite JSON; negative zero is normalized to zero.

Malformed inputs throw `ScenarioValidationError` with `issues`. Any nonfinite candidate accumulation, policy sum or comparison throws `ScenarioArithmeticError`, with `code=NONFINITE_ARITHMETIC` and a numeric field path; no partial result is returned. Candidate paths use `policies.<policy>.decisions[<sorted-job-index>].candidates[<enumeration-index>].<field>` for diagnostics before selection; policy/comparison paths identify their returned fields. Feasibility is checked before arithmetic. Ordinary unplaceable jobs are returned in `unplaced`, not thrown.

### Portability and implementation decisions

The complete engine, comparison and alternative capture fit in `src/planner/schedule.ts`; separate compare/explain files would only split small internal helpers. The public entry point stays unchanged. No new runtime dependencies were added.

**Build adjustment from the plan:** the standalone output is native ESM with declarations, not CommonJS. TypeScript 7 removed the planned legacy resolver, and forcing CommonJS source conflicted with Next's bundler. `tsconfig.planner.json` therefore uses NodeNext with `rewriteRelativeImportExtensions`; source imports explicitly name `.ts`, emitted imports name `.js`. The regular app config allows TypeScript import extensions. `scripts/build_planner.cjs` runs the installed compiler and writes `dist/planner/package.json` with `type=module`. No source copying or custom transpiler is involved. Node 24.21.0 can consume this synchronous ESM output from the included CommonJS scripts; ESM consumers can import it directly. Older Node versions are outside the pinned runtime requirement.

`npm run smoke:planner` compiles only planner source, loads the public entry outside Vitest/Next, reads the bundled JSON, and asserts three policy shapes, deterministic repeat results, input preservation, JSON round-trip equality and typed validation failure. The smoke test fails if the public export is broken.

### Recorded outcomes

| Check | Outcome |
|---|---|
| `npm test` | 63 passed: 31 existing contract checks and 32 planner cases |
| `npm run typecheck` | Passed after final code changes |
| `.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_prepare_data.py` | 11 passed |
| `npm run smoke:planner` | Passed with native ESM output and Node 24.21.0 |
| `npm run build` | Passed after resolving CommonJS and import-extension integration failures |
| Exported foundation page | Opened the final `out/` through a loopback HTTP server in Brave; visually inspected the updated P2 status copy and five-region table at the desktop viewport. No interactive dashboard or browser timing claim. |
| `npm run demo:planner` | Five runs covering four teaching situations, with hand-derived assertions; passed |
| `npm run benchmark` | Passed after review fix; both maximum-size fixtures below 50 ms p95 |

Tests observed failing before implementation: 12 initial whole-window/accounting/validation/overflow cases; then 12 newly unsupported objective/comparison cases. Five other second-batch tests immediately passed because the existing reservation/copying rules already satisfied them. No separate failed-before-fix claim is made for those tests. The suite tests all-hour capacity, exact deadlines, missing signals, excluded home, concurrent jobs, policy isolation, candidate preservation, stable ordering, unchanged inputs, empty/different completed sets, signed/nonpositive references and candidate/policy/comparison overflow.

### Worked outcomes for H2

Run `npm run demo:planner` to regenerate [the complete teaching requests and results](../examples/p2-worked-examples.json), plus the bundled historical result summary. Teaching cases deliberately use constant synthetic signals; their `priceSeed` is inherited metadata and is not the recipe for these hand-authored price overrides. Labels explicitly call them flat teaching fixtures. They are separate from the seeded production snapshot.

Each teaching job uses 100 kW for two hours: **200 kWh**. The five-region request is retained even though only CISO and ERCO are eligible in these focused cases.

| Situation | Wait at home | Choose region/time | Outcome |
|---|---|---|---|
| Geographic benefit | CISO, 400 g/kWh, $100/MWh → 80 kg, $20 | ERCO, 100 g/kWh, same price → 20 kg, $20 | 60 kg lower attributed CO₂; simulated cost unchanged |
| Pinned urgent job | CISO, [0,2), 80 kg, $20 | Identical | No benefit; constraint honored |
| Carbon/cost tradeoff, carbon priority | CISO, 80 kg, $20 | ERCO, 20 kg, $40 | 60 kg lower, $20 more simulated electricity cost |
| Same tradeoff, cost priority | CISO, 80 kg, $20 | CISO, 80 kg, $20 | Cheaper choice retains higher CO₂ |
| Zero capacity | No placement | No placement | NO_FEASIBLE_WINDOW; no completed work, savings null |

**Actual historical-carbon snapshot, July 2:** all three policies place the same three jobs and consume 64 kWh. Earliest-home: 13.5321 kg and $3.964 simulated electricity cost. Wait-home: 9.3661 kg and $4.500. Region-and-time: exactly the same as wait-home. Thus this batch shows a time-shifting benefit but **zero additional geographic benefit**. We preserve that outcome; no region, carbon series, home assignment or price was changed to manufacture a win. Carbon uses provider estimates with hindsight; monetary outcomes use synthetic prices and do not establish real savings.

### Latency evidence and limits

Final measurement after the review fix: Windows 10.0.26200 x64, Intel Core Ultra 7 155H, 22 logical CPUs, approximately 15 GiB memory, Node v24.21.0. Feasible fixture: p50 **0.917 ms**, p95 **2.062 ms**, maximum **3.490 ms**. Saturated fixture: p50 **0.360 ms**, p95 **0.573 ms**, maximum **2.091 ms**. Both meet the 50 ms engine budget. The artifact retains this run rather than selecting the fastest of prior runs.

`scripts/benchmark_planner.cjs` constructs the plan's two fixed maximum-size fixtures: five regions, 24 slots, 30 jobs, two-hour duration, one GPU at 1 kW, release 0/deadline 24, eligibility everywhere and homes cycling through sorted IDs. Capacities are uniformly 30 or 0. Source carbon and seed-4271 price arrays come unchanged from the snapshot. It checks completion counts, warms up 20 times, records all 200 combined-validation/three-policy calls, and computes nearest-rank p50/p95/max. It fails if either p95 exceeds 50 ms. [Raw samples, inputs and environment](benchmarks/p2-node.json) are retained; no slow sample is discarded.

No browser edit-to-paint, first-load, mobile, live-network or cloud execution latency is claimed. Those require the P3 interface and P4 release checks. This benchmark is evidence for this machine and these fixtures only.

### Review checkpoint

Fresh-context EGM/Superpowers review found one minor runtime issue: accepted `releaseSlot: -0` survived into candidate start times, contradicting the stated JSON round-trip/normalization guarantee. The primary implementer reproduced the failure with a regression test, normalized zero when constructing candidates and confirmed the regression and full checks pass. No important scheduling, reservation, comparison or portability defects were found by static review. The fix was not independently re-reviewed. See [review scope and disposition](reviews/p2/goldfish_review_report.md).

**H2 is pending:** approve P3 to connect the map, 5 × 24 heatmap, job editing and policy comparisons, or request engine changes first. P1 remains documented in [its evidence report](p1-validation.md). These phase changes are local on `feat/p2-planner`; they have not been pushed to GitHub.
