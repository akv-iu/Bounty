# Compute Follows the Sun: implementation plan

> For agentic workers: follow Superpowers writing-plans for planning, then executing-plans or subagent-driven-development only after the user selects an execution method and approves implementation. Human gates below take precedence over automatic continuation between tasks.

**Goal:** Build an inspectable, reusable planner for placing flexible AI jobs across five regions and 24 hourly slots, with an interactive dashboard explaining the tradeoffs.

**Architecture:** A pure TypeScript planning module accepts versioned scenario inputs and produces comparable policy results. A static Next.js dashboard consumes that module and bundled data; AI job entry is an optional separate feature.

**Tech stack:** Next.js, React, TypeScript, Tailwind, D3 geographic/color utilities, Python for preparation, Vitest, static Cloudflare Pages hosting.

**Spec:** [Design_Proposal.md](Design_Proposal.md) and [UI_Direction.md](UI_Direction.md).

Prepared October 27, 2026, following acceptance of the product direction. Scope: one developer, 24–48 hours of available build time. Estimates exclude time waiting for human review and are not delivery guarantees. P1 implementation is now complete pending review; later phases remain gated.

Revision: critically reviewed using the installed Superpowers 7.0.1 writing-plans skill on October 27, 2026. This is a primary-agent self-review, not an independent reviewer verdict. Findings and their disposition are recorded in [Plan_Review.md](Plan_Review.md).

**Current phase: P1 — implemented, verified and EGM-reviewed; findings corrected. [HUMAN CHECK REQUIRED: H1 before P2]** See [P1 evidence](../docs/p1-validation.md).

## Phase controls and human checkpoints

Tags used throughout execution:

- `[AGENT WORK]`: work inside an approved phase; routine inspections, tests and fixes continue without repeated approval.
- `[AUTO CHECK]`: evidence the agent must produce before a phase is ready. A passing check is not a human approval.
- `[HUMAN CHECK REQUIRED: Hn]`: present the specified evidence and stop before the next phase. Record the user's decision; silence and elapsed time are not approval.
- `[OPTIONAL — NOT AUTHORIZED]`: excluded from the core build until explicitly selected.
- `[BLOCKED]`: a dependency or failed check prevents completion; record the cause and smallest next action.

| Phase | Deliverable | Automatic exit evidence | Human checkpoint / decision | Current status |
|---|---|---|---|---|
| P0 — scope and phased plan | This plan, agreed product/UI direction, reusable-engine boundary, latency budgets and review rules | Document coverage and consistency review | **H0:** confirm phases, core scope and execution method before coding/data preparation | APPROVED |
| P1 — data and input contract | A reproducible five-region dataset or fully synthetic fallback; validated request/result contract | 120 aligned carbon slots or explicit fallback; source/unit/timezone report; malformed-input checks | **H1:** inspect data labels and one example request/result; approve what the demo may claim | VERIFIED AND REVIEWED - awaits H1 |
| P2 — planning engine | All three policies, full-window feasibility, accounting and explanations through the reusable entry point | Arithmetic/reservation/comparison tests, standalone Node smoke check and early maximum-size benchmark | **H2:** inspect benefit, no-benefit, tradeoff and failure examples plus early timings; approve decision behavior | NOT STARTED — awaits H1 |
| P3 — complete interface | Map, heatmap with job overlays, job edits, selected-job explanations and comparisons | Linked selections, keyboard access, readable overlays, failed-placement behavior; desktop and narrow-screen evidence | **H3:** use the working page and approve layout/behavior before visual polish is considered done | NOT STARTED — awaits H2 |
| P4 — performance and release preparation | Measured latency, production export, source notices, README and demo script | Production build, relevant tests, benchmark report and rehearsed demo pass | **H4:** inspect measured results and public-facing claims; authorize deployment to a named destination | NOT STARTED — awaits H3 |
| P5 — authorized deployment and handoff | Hosted demo, local fallback and reproduction instructions | Smoke test actual deployed URL, verify packaged assets and scenario labels | User receives a final evidence summary; competition submission remains separately authorized | NOT STARTED — awaits H4 |
| P6 — optional AI job entry | Text-to-form draft with review, timeout/cancel and manual fallback | Parser validation, ambiguous-time handling, secret protection, cost and latency checks | **H-AI:** approve model, integration, usage cap and extra scope before implementation; review behavior before enabling publicly | OPTIONAL — NOT AUTHORIZED |

The earlier conversational acceptance covers the product direction, not these new gate decisions. No gate is marked approved until the user actually approves it. If the user explicitly approves several named phases together, record that scope and do not ask again at those same boundaries. Scope changes affecting data truthfulness, cost, dependencies or execution authority reopen the relevant checkpoint.

At each checkpoint present: (1) the artifact or working example, (2) what passed and what failed, (3) material assumptions or deviations, and (4) one concrete decision: approve the next phase, request changes, or pause. Do not ask the user to approve unfinished evidence. Keep the checklist and decision record here current.

### Decision record

| Gate | Decision | Evidence / date |
|---|---|---|
| H0 | Approved | User requested implementation with Ponytail and Elephant–Goldfish review on October 27, 2026; primary-agent implementation with phase-boundary reviews |
| H1 | Pending | Five-region July 2 historical snapshot, contract and static shell implemented; evidence in docs/p1-validation.md |
| H2 | Pending | Production engine not implemented |
| H3 | Pending | Earlier single-job mockup exists; heatmap/batch UI not implemented |
| H4 | Pending | Performance and deployment checks not run |
| H-AI | Not requested | Optional AI remains disabled |

## Global constraints

- Five regions; 24 one-hour UTC intervals; at most 30 jobs; non-preemptible whole-window placement.
- Equivalent hardware/runtime and prepositioned data; no actual GPU execution or network-latency guarantee.
- Earliest-at-home, wait-at-home and choose-region/time policies use the same jobs and independent copies of initial capacities.
- No aggregate savings unless the completed job ID sets match; preserve signed costs/differences and identify the comparison reference.
- Historical carbon only after verifying the input files. Prices, workloads and capacity remain explicitly synthetic.
- The engine must be usable without a browser, framework, network request or AI response.
- The core requires no paid API, paid font or paid domain; keep hosting inside the chosen free tier.
- Scheduling and interface performance targets remain unverified until measured on a recorded device and browser.

## Review focus

1. **Input isolation and portability:** caller-owned arrays are unchanged, reservations cannot leak, and the compiled entry point works in plain Node outside the test runner. P2 owns the checks.
2. **Time meaning:** MISO's fixed EST reporting must not become daylight-saving Eastern time. P1 owns the exact conversion fixture.
3. **False savings:** empty or different completed job sets, zero reference cost and negative prices must not become a misleading percentage. P2 owns the tests.
4. **UI control confusion and concurrency:** inspection must not reschedule, and concurrent jobs cannot overwrite each other visually. P3 owns the tests.
5. **Stale displays after edits:** all views and all three comparisons must use the latest scenario, including transitions into and out of no-placement. P3 owns the tests.

## Source of decisions

- Design_Proposal.md defines input meaning, accounting, scheduling behavior, comparison rules and acceptance requirements.
- UI_Direction.md defines the accepted visual direction and intended heatmap interaction.
- Project_Spec.md is historical background; it does not override the current design.
- output/torus-ui-preview.html is a single-job synthetic interaction prototype, not the production scheduler or the final heatmap implementation.
- goldfish_review_report.md records the prior design reviews. P1 review is recorded separately under docs/reviews/p1/; latency remains unmeasured.

## Build boundary

Keep one project with a portable TypeScript planner and a Next.js dashboard consuming it. Start with a static export on Cloudflare Pages' free tier. Use Tailwind for styling, D3 geographic/color utilities, an SVG map and React heatmap cells. Prepare normalized scenario JSON locally with Python. Use Vitest for meaningful planner and integration tests. No recurring paid service is required for the core.

Dependency versions will be selected from mutually compatible stable releases at implementation time and pinned in the lockfile. Keep required license/source notices. Do not copy Torus's proprietary font assets; bundle the free font substitutes.

## Public planner contract

Use src/planner/index.ts as the single consumer entry point. It exposes request/result types, runtime validation, and planScenario(request). The function has no React, DOM, framework, network, clock or model dependency. All scenario time and signal inputs come from the request. It does not mutate the caller's request or retain reservations across calls.

Request version 1 contains:

- schemaVersion and scenario ID; a start timestamp with an explicit UTC offset, one-hour intervals and 24 slots.
- Five region IDs with display metadata, per-hour carbonGPerKwh, priceUsdPerMwh and availableGpus, plus source/classification references. Missing data is explicit and makes affected windows ineligible.
- Jobs with stable IDs, home/eligible region IDs, release/deadline slot boundaries, integer duration/GPU requirements and estimated facilityPowerKw.
- Objective: carbon or cost. Scenario bounds: at most 30 jobs, five regions, 24 intervals.

Validation rejects unsupported versions, duplicate/unknown IDs, nonfinite or inconsistent values, invalid intervals and malformed array lengths. Set intervalHours to exactly 1. A start timestamp must end in Z or an explicit numeric offset and is normalized to UTC; timezone-less timestamps are invalid. Slot boundaries are integers with 0 <= releaseSlot < deadlineSlot <= 24; durationSlots is an integer in [1,24]. GPU counts must be positive integers, capacities nonnegative integers and facilityPowerKw positive. Empty jobs are valid and return an empty plan. Empty eligibleRegionIds are also valid but return an unplaced job. A duration longer than the release/deadline window is valid input but has no feasible window. A valid requested GPU count above every pool's capacity is unplaced, not a schema error. Reject requests larger than five regions/24 slots/30 jobs; this version requires exactly five regions and 24 slots. Keep finite signed prices. Missing carbon/price uses JSON null, never undefined or zero. Nonfinite carbon is invalid; the production snapshot additionally requires complete coverage for a historical label. Any signed source-carbon observation must be documented and resolved at H1, not silently rewritten.

Result version 1 contains scenario/objective references and results for all three policies. Each policy returns assignments, typed unplaced reasons, submitted/planned/unplaced counts, energy/cost/carbon totals and relevant alternatives at each scheduling decision. Comparison metadata identifies completed job IDs and whether aggregate differences are valid. The result describes a plan against the supplied snapshot; it is not a cloud reservation.

Canonical result field names: policies.earliestHome, policies.waitHome and policies.regionAndTime; each has assignments, unplaced and totals with energyKwh/costUsd/carbonKg. Assignments identify jobId, regionId, startSlot and endSlot (exclusive). Comparison uses referencePolicy = waitHome, comparable and reason. reason is NO_COMPLETED_WORK when every result is empty, DIFFERENT_COMPLETED_JOBS when ID sets differ, and null only for the same nonempty set. Savings values are null when incomparable. For valid comparisons a difference is reference minus chosen, so negative means an increase. Percentage is null for a nonpositive reference cost or carbon total. Serialize only finite numbers, strings, booleans, arrays, objects and explicit null; never expose Sets, Maps, Dates, NaN or Infinity in the public result. Freeze this contract in P1 examples/tests before downstream implementation.

The dashboard imports this entry point directly. A test or local example invokes it without a browser to prove the integration boundary. Do not create an npm publishing workflow, separate backend, plugin registry or deployment adapter. Later consumers may use the module in JavaScript/TypeScript, or expose its JSON contract through a thin service for other languages. A real execution consumer must independently recheck capacity, data access, permissions and dispatch state.

## Implementation sequence and file responsibilities

| Time budget | Work and intended files | Completion evidence |
|---|---|---|
| Hours 0–2 | Establish data gate. Create scripts/prepare_data.py, scripts/requirements.txt, data/README.md and data/scenario.json. Inspect actual EIA workbooks before choosing timestamp/column conversion. Normalize a complete common day; otherwise choose the fully synthetic branch. | 120 valid aligned carbon values with provenance, or one consistently labeled synthetic scenario. Record MISO fixed-EST conversion. Preserve source download locations and dates. |
| Hours 2–4 | Create package.json, package-lock.json, tsconfig.json, next.config.ts, next-env.d.ts, postcss.config.mjs, .gitignore and vitest.config.ts as required by the selected stable scaffold. Define src/planner/types.ts, validate.ts and index.ts. | Runnable test environment, successful minimal static build and validated sample request before H1. |
| Hours 4–8 | Implement src/planner/schedule.ts, compare.ts and explain.ts. Add tests/planner.test.ts, tests/contract.test.ts, tests/fixtures.ts, tsconfig.planner.json, scripts/build_planner.cjs, scripts/smoke_planner.cjs and scripts/benchmark_planner.cjs; record early evidence in docs/validation.md. | Full-window behavior, comparisons and standalone Node use pass; early benchmark exposes compute problems before UI work. |
| Hours 8–14 | Create src/app/layout.tsx, page.tsx and globals.css; src/components/PlannerDashboard.tsx, RegionMap.tsx, RegionHeatmap.tsx, JobEditor.tsx, ComparisonTable.tsx and JobDetail.tsx. Add public/us-states.json, free font assets/notices and tests/ui.test.tsx. | Working batch/map/heatmap/edit/comparison flow, concurrent-job selection, and meaningful interaction tests; browser/keyboard review before H3. |
| Hours 14–18 | Measure production-browser responsiveness and initial load; finish docs/validation.md, README.md and docs/demo.md. | Production export, full relevant tests and recorded latency results ready for H4; local demonstration rehearsed. |
| Hours 18–20 | Deploy only after H4 authorization; verify actual hosted behavior and preserve the local build. | Working URL, smoke-test evidence and reproducible handoff. |
| Hours 20–24 | Protected recovery time for data, integration, browser and deployment problems. | Repair core failures and re-run affected checks. Do not consume this buffer on AI or animations. |

Exact scaffold-generated filenames may vary with the pinned Next.js version; document the actual generated files rather than duplicating configuration. Do not create empty modules solely to match this table; merge a small helper into its caller when that keeps the dependency boundary clear.

These are aggressive active-work targets, not a promise that a full build fits every 24-hour event. At the 14-hour mark, if the complete core flow is not working, drop all optional work and use the protected buffer; if still infeasible, report the exact remaining core work at the next checkpoint and use the 48-hour window only if available. Do not quietly remove a region, baseline, heatmap, accessibility requirement or honest data label to meet the estimate.

## Phase task checklists

### P0 — establish the execution agreement

- [x] Carry forward the accepted scope, free-stack direction, heatmap and optional AI without restarting discovery.
- [x] Define phase outputs, evidence, human gates and measurable latency budgets.
- [x] Link this plan from the project README and keep a short repository handoff in AGENTS.md.
- [x] Self-review the plan against the design for coverage, consistent interfaces, truthful status and unnecessary scope.
- [x] Re-run that review with installed Superpowers 7.0.1 and record concrete corrections in Plan_Review.md.
- [x] **[HUMAN CHECK REQUIRED: H0]** Approved by the user's implementation request. Primary agent implements; fresh-context EGM reviewers check phase boundaries.

### P1 — prove data and contract together

**Files:** scripts/prepare_data.py, scripts/requirements.txt, tests/test_prepare_data.py, data/README.md, data/scenario.json, src/planner/types.ts, src/planner/validate.ts, src/planner/index.ts, tests/contract.test.ts, tests/fixtures.ts and the scaffold/config files listed above.

**Interfaces:** Python CLI `python scripts/prepare_data.py --mode historical --input-dir data/raw --output data/scenario.json`, or explicit `--mode synthetic --output data/scenario.json` without raw files. Never switch modes automatically on download/parse failure. It validates normalized output before writing and exits nonzero with a specific error for invalid input. data/scenario.json is a complete example PlanRequest, including seeded jobs and provenance. TypeScript `validateScenario(value: unknown): ValidationResult`, where the discriminated union is `{ok: true, value: PlanRequest}` or `{ok: false, issues: ValidationIssue[]}`; each issue includes a field path and reason. Export the versioned request/result types and validator through src/planner/index.ts. This task defines all types consumed by P2/P3.

- [x] **[AGENT WORK]** Inspect the real workbooks and record actual columns, units, reporting zones, provenance and common coverage before implementing source mappings. Stop this exploration after the two-hour data gate; document a missing-region substitution or the fully synthetic fallback for H1 rather than silently fabricating coverage.
- [x] Create the minimal static-export scaffold, pin a compatible Node/dependency set and record versions before running Vitest commands. Add a minimal app shell only; run `npm run build` and confirm out/ exists. Install the required Python reader in a project virtual environment and document Windows activation/commands. Test-runner import/setup errors must be fixed before treating a behavioral test as a meaningful red result.
- [x] Freeze synthetic prices independently of carbon/results: unsigned 32-bit LCG, seed 4271, recurrence `(1664525 * state + 1013904223) modulo 2^32`, price `40 + state modulo 61` USD/MWh, iterating stable region-ID order then UTC slot order. Save the generated table and recipe. Flat-price test fixtures are a separate control, not a substitute scenario.
- [x] Write the failing preparation fixtures: MISO 2026-07-01 HE13 EST maps to [17:00,18:00) UTC; duplicate/missing slots and nonfinite values fail; five complete 24-hour sequences pass. Run `python -m unittest discover -s tests -p test_prepare_data.py`; confirm each new fixture fails for the intended missing behavior before implementing it.
- [x] Implement only the inspected conversion and declared fallback; rerun the same command and require PASS. Document carbon definition/unit conversion and do not select a day because it maximizes savings.
- [x] Write contract tests named `rejects_unsupported_schema`, `rejects_unknown_region`, `rejects_bad_lengths`, `rejects_nonfinite_inputs`, `preserves_signed_prices`, and `accepts_explicit_missing_signal`. Use the request fields defined above; missing signals remain unavailable for placement. Run `npx vitest run tests/contract.test.ts`, confirm intended failures, implement the validator, and require PASS.
- [x] Add boundary assertions for the contract above: slot 24 is a valid deadline, slot 25 is invalid; a missing timezone is invalid; an empty job list and an over-capacity job are valid requests. Run the same contract tests and require PASS. Verify explicit historical failure leaves any prior valid output unchanged; write validated data through a temporary file and replace the output only after success.
- [x] **[AUTO CHECK]** Save a sample request, proposed result shape, data coverage/provenance report, test results and exact chosen dependency versions for review. Record the command outcomes here or in data/README.md.
- [ ] **[HUMAN CHECK REQUIRED: H1]** Review data truthfulness, region mapping, fallback if used, and the reusable input/output contract before engine implementation. Commit the verified phase with only its intended files if repository commits are authorized.

### P2 — build the reusable planner

**Files:** src/planner/schedule.ts, compare.ts, explain.ts, index.ts; tests/planner.test.ts, tests/contract.test.ts, tests/fixtures.ts; tsconfig.planner.json, scripts/build_planner.cjs, scripts/smoke_planner.cjs, scripts/benchmark_planner.cjs, package.json scripts, docs/validation.md and README.md usage example.

**Interface:** `planScenario(request: PlanRequest): PlanResult` exported from src/planner/index.ts. Validate at entry and throw a typed `ScenarioValidationError` containing validation issues for malformed input; a valid job with no feasible placement is a normal unplaced result. `PlanResult` includes `schemaVersion`, `scenarioId`, `objective`, results for the three named policies, and comparison eligibility/reference metadata. Per-policy assignments retain full-run totals and candidate alternatives at the decision; diagnostics distinguish invalid input from no placement under policy reservations. If any otherwise-feasible candidate calculation, policy sum or comparison yields nonfinite arithmetic, throw an exported `ScenarioArithmeticError extends Error` implementing `ArithmeticFailure` (`name`, `code=NONFINITE_ARITHMETIC`, nonempty numeric field `path`), aborting the whole call without a partial result. No clamping, candidate skipping or false unplaced status. P1's exact frozen contract, unplaced-reason precedence and overflow examples are recorded in ../docs/p1-validation.md.

- [ ] Write failing tests for exact accounting (`energyKwh === 200`, `costUsd === 20`, `carbonKg === 80` for the documented fixture), varying hourly signals, exact-deadline finish, all-hour GPU capacity, missing signals and excluded home. Run `npx vitest run tests/planner.test.ts` and confirm intended failures.
- [ ] Test the frozen arithmetic error contract: two hours at `Number.MAX_VALUE` kW, overflowing sums of finite job totals, and overflowing comparison differences/percentages must throw `ScenarioArithmeticError` with the failed path and return no partial plan. Feasibility rejection is checked before candidate arithmetic. Export the error class alongside planScenario from index.ts.
- [ ] Implement candidate enumeration, deterministic greedy ordering/reservation and calculation with shared units. Run the same tests and require PASS before comparison work.
- [ ] Add failing tests for three independent policy capacities, unchanged input arrays, identical repeated results, deterministic objective/tie ordering, adversarial greedy rejection, zero/negative baseline cost, unequal completed job sets and equal-energy flat-price deltas. Implement comparison metadata and explanations until the same tests pass.
- [ ] Add empty-work assertions: empty jobs and all-unplaced results must have comparison.comparable equal to false, comparison.reason equal to NO_COMPLETED_WORK and null savings. Excluded eligible regions and duration/window conflicts are normal unplaced results. Run the same planner tests to demonstrate the failures, implement, then require PASS.
- [ ] Prove the public interface in plain Node: tsconfig.planner.json compiles only src/planner to CommonJS with declarations in dist/planner; scripts/build_planner.cjs runs that compiler and writes dist/planner/package.json with type commonjs. `npm run smoke:planner` builds then runs scripts/smoke_planner.cjs, which loads dist/planner/index.js, parses data/scenario.json, calls planScenario and asserts result JSON round-trip equality and input immutability. No Next.js, Vitest, DOM or network is involved. A broken public export must fail this check. This is local build output, not npm publication.
- [ ] **[AUTO CHECK]** Add the benchmark runner now, using the compiled entry point and the fixed fixtures described under Latency measurement. Record the 30-job p95 before UI work; run `npx vitest run tests/contract.test.ts tests/planner.test.ts`, `npm run smoke:planner` and `npm run benchmark`, and inspect all outcomes.
- [ ] **[AUTO CHECK]** Prepare four small worked results: feasible geographic benefit, a pinned/urgent no-benefit case, cost/carbon tradeoff, and capacity rejection. If historical data does not demonstrate a benefit, keep that outcome and use a separate labeled teaching fixture. Each includes inputs, assignments and arithmetic; no LLM-generated justification.
- [ ] **[HUMAN CHECK REQUIRED: H2]** Review these results and early timings before wiring the full UI. Commit the verified phase if authorized.

### P3 — connect the complete interface

**Files:** the app/component/assets files in the implementation table, tests/ui.test.tsx and UI test dependencies/config only as needed; update Initial/UI_Direction.md with actual evidence. Treat output/torus-ui-preview.html as a visual reference, not a second application to maintain.

**Interfaces:** PlannerDashboard owns the validated request, PlanResult, selectedJobId, selectedRegionId, inspectedSlot and heatmapMeasure. State/control changes call planScenario only when the request changes. Visual components receive these values plus explicit selection/edit callbacks; they never independently schedule or invent totals. JobEditor submits a validated draft; schema errors stay visible without destroying the last valid plan.

Data display is not cloud-region availability. On the map and heatmap, free GPUs are the chosen policy's initial capacity minus all assigned GPU use in that slot. The chosen policy is regionAndTime. Shade by the original carbon/price signals, not by remaining capacity. Outline only the selected job's full window; show the selected cell's list of every overlapping job and total/free GPUs. This avoids stacking invisible bars while retaining the five-row layout. At narrow widths use a horizontally scrollable heatmap with readable minimum-width cells and fixed region labels; keep page-level scrolling vertical. Provide native region/hour selects as an equivalent accessible selection path.

- [ ] Write failing interaction tests that change deadline/eligibility and assert the recommendation, timeline and all three policy rows update to the same new result; test a no-placement state and recovery. Run `npx vitest run tests/ui.test.tsx` and confirm intended failures.
- [ ] Implement the map/editor/comparisons/detail with one shared result. Reuse the accepted dark palette and free fonts. Rerun the interaction tests and require PASS.
- [ ] Write failing tests `heatmap_measure_does_not_reschedule`, `inspection_does_not_reschedule`, and `cell_selects_region_and_hour`. Count planner calls and compare assignments before/after the action. Implement the 5 x 24 heatmap with common per-measure scales, units, missing-data distinction and job overlays. Rerun and require PASS.
- [ ] Add `concurrent_jobs_remain_visible`: two 16-GPU jobs in one 32-GPU slot must appear in cell detail, with zero free GPUs and a selectable window for either job. Add constant-signal and missing-signal cases: a flat signal has one color and a single-value legend; null is visibly unavailable. Require PASS; a price-view toggle must not change either assignment.
- [ ] Keep the selected preset's releaseSlot unchanged during deadline/eligibility edits. Adding a preset explicitly sets releaseSlot from the inspected hour and rejects a deadline outside the horizon with a visible form error. Label unapplied invalid drafts so the last valid plan is not mistaken for the new request's result.
- [ ] **[AUTO CHECK]** Inspect keyboard operation, reduced motion, readable overlays and narrow screens in the browser. Capture the actual UI with a selected job and both normal/failure states. Record any gaps instead of marking visual review complete from unit tests alone.
- [ ] **[HUMAN CHECK REQUIRED: H3]** Review the functioning heatmap and editing flow. Resolve requested UI revisions before moving to release preparation. Commit the verified phase if authorized.

### P4 — prove responsiveness and prepare release

**Files:** modify scripts/benchmark_planner.cjs and docs/validation.md from P2 as needed; create docs/demo.md; update README.md and required license notices; make only performance fixes justified by profiling.

**Interface:** `npm run benchmark` invokes the benchmark script and prints scenario size, runtime/device details supplied for the report, sample count and p50/p95/max. Tests import the same planScenario used in the UI. Do not invent a separate optimized benchmark implementation.

- [ ] **[AUTO CHECK]** Rerun the early performance protocol on the final core, including 20 warm-ups and 200 measured planner runs. Fail the benchmark check if p95 exceeds the 50 ms budget; retain observed numbers. Measure edit-to-paint over at least 50 committed edits in a production browser, retaining every sample, and record the 100 ms target outcome.
- [ ] Profile missed targets, make the smallest justified change, and rerun affected tests and timings. A target change requires an explicit H4 decision; do not silently relax it.
- [ ] Run `npx vitest run`, `python -m unittest discover -s tests -p test_prepare_data.py`, and `npm run build`; require PASS and a generated static `out/` directory. Smoke-test the exported build and offline exploration after assets load. These commands are planned, not currently runnable in this documentation-only repo.
- [ ] Prepare the four-scenario demonstration and README reproduction/module-use instructions. Validate data labels, font/map notices, no embedded provider secrets and no implication of actual GPU execution.
- [ ] **[HUMAN CHECK REQUIRED: H4]** Present the working local build, test/performance report, remaining limitations and exact proposed hosting destination. Get deployment authorization before any public release.

### P5 — deploy the approved artifact

- [ ] **[AGENT WORK]** Deploy only the H4-approved artifact to the authorized destination; retain the local build and reproducible source.
- [ ] **[AUTO CHECK]** Open the actual public URL, exercise an edit/heatmap selection/no-placement scenario, verify fonts/map/data load and confirm scenario labels. A successful upload alone is not completion.
- [ ] Record URL, artifact/source revision, smoke-test result and known limitations in docs/validation.md; deliver the final evidence summary. Do not submit to the competition without a separate user instruction.

### P6 — optional AI, separate authorization

- [ ] **[OPTIONAL — NOT AUTHORIZED] [HUMAN CHECK REQUIRED: H-AI]** Before implementation choose the specific model/provider, free-use conditions, usage cap, timeout, security boundary and expected latency. Confirm extra scope with the user; write a short extension plan using those concrete choices.
- [ ] The extension must test ambiguous timezones, invalid/partial responses, timeout/cancellation and preserving manual entry. The deterministic planner remains the only source of assignments and arithmetic. AI is not on the critical path for P1–P5.

## Required verification

1. Arithmetic fixture: 100 kW for two hours, $100/MWh and 400 gCO2/kWh gives 200 kWh, $20 and 80 kg. Include changing hourly signals and signed price differences.
2. Exact-deadline completion, full-window GPU capacity, independent capacities across policies, excluded home, missing signals and deterministic ordering/ties.
3. Identical completed job sets before aggregate savings; zero/negative reference-cost handling; greedy failure without claiming global infeasibility or optimality.
4. Independent seeded synthetic prices saved with the scenario. A flat-price control produces zero cost differences for identical completed energy.
5. Repeat calls leave the input unchanged and return identical results. The public planner entry point works in a non-browser test with no React/Next imports.
6. Region/hour selection links map and heatmap. Overlays, legends, local-time labels and selected-job detail remain readable; unavailable cells are visibly distinct from low intensity.
7. Keyboard use, reduced motion, small-screen overflow and offline exploration after assets load. Do not require an AI response or live data request to explore a scenario.

## Latency measurement

Targets are acceptance budgets, not current measurements:

- Combined three-policy scheduling: p95 at or below 50 ms for five regions, 24 slots and 30 jobs on the declared reference laptop.
- Committed form edit to updated results painted: p95 at or below 100 ms on that browser/device.
- Scrubbing and selection reuse results. No data fetch, AI request or scheduler invocation on those paths.

Run the first benchmark in P2 and repeat it in P4. Use the same five-region/24-slot inputs for two 30-job fixtures: all jobs release at 0, finish by 24, take two hours and request one GPU at 1 kW, eligible everywhere; home IDs cycle through sorted region IDs. The high-feasibility fixture has capacity 30 in every slot; the saturated fixture has capacity zero. Preserve inputs and use the fixed price seed. Run 20 warm-ups and at least 200 measured calls per fixture; use nearest-rank percentile on sorted durations, recording p50/p95/max separately for each fixture. Validation and all three policies are inside the timed call. A small input is not a substitute for the supported maximum.

The Node benchmark does not prove browser responsiveness. In a production browser, measure at least 50 committed deadline/eligibility/objective edits on the maximum-size scenario, from the input event through the first frame showing matching updated recommendation/comparisons. Record device, browser, sample count and p50/p95/max; retain slow samples. Report the production engine-only browser timing separately if it differs materially from Node. Measure initial cold load and asset sizes separately under a named network/CPU profile. Never report a synthetic job duration as real execution latency.

If computation misses the budget, profile it, remove duplicate work and rerun. A worker is a contingency only for measured blocking work. Remote-service latency and interactive inference SLAs are outside this static batch-planning demo.

## Day-two options, in priority order

First resolve failed core checks and improve heatmap/alternative explanations. Then consider richer job input and restrained routing/playback animation. Optional AI job entry comes only after the core is complete and only if enough time remains to validate it.

AI translates text into a draft of the existing form, with explicit units and timezone, followed by user review and shared validation. It never decides feasibility or supplies energy inputs. Keep it disabled by default, cancellable and time-bounded; preserve manual entry on all failures. Choose a model/provider and a hard spending/usage arrangement before implementation. Free-tier availability, local hardware suitability and model response time are not assumed. A hosted model requires a secure server-side endpoint and therefore a separate deployment decision; no API secret may be embedded in the exported site.

## Keeping implementation context useful

Maintain these three planning documents as the source of decisions; avoid parallel contradictory plans. Plan_Review.md is a findings ledger, not a second roadmap. Put measured outcomes in docs/validation.md, not into requirements as claimed achievements. Keep README.md as the concise entry point to setup and document links. Update the existing root AGENTS.md with verified commands and current boundaries; do not claim it still needs to be created. Mark scope changes and unresolved data questions explicitly. Use EGM drift/review checks when implemented behavior or design scope changes, not on every cosmetic edit.

## Approval boundary

The user has approved H0 and P1 implementation with plugin-assisted review. H1 is the next gate; P2 is not started. Superpowers 7.0.1 guides execution, Ponytail limits scope, and EGM supplies independent phase review. Follow actual user decisions; do not infer approval from a passing test.
