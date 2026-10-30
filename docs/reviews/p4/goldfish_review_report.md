# Goldfish annotated review report — P4

Target: docs/validation.md, P4 section (lines 3–53 at dispatch), with release scripts, measurements, demo, README, phase plan and connected UI sources. One fresh-context Codebase Details reviewer used the EGM re-implementation standard. No second review round was run.

## Major — checkbox timing excluded scheduling

Affected: validation timing description; browser_probe.js event observer; JobEditor checkbox handler; PlannerDashboard commit.

The initial probe started all timing at native `change`. React derives checkbox `onChange` from the preceding `click`, synchronously calling the planner before native `change`. Sixteen eligibility samples therefore undercounted the complete edit path. The remaining 40 select samples were insufficient for the required 50 complete measurements.

Disposition: **PROPOSE FIX — applied within authorized P4 verification scope.** Capture the native checkbox click at document capture phase, before React's root listener; carry that timestamp into the change observer. Select controls continue to use change timestamps. Reject missing timestamps. Preserve the first report as `docs/benchmarks/p4-browser-initial.json`, superseded for aggregate latency acceptance. Repeat the complete native-edit protocol and store the corrected run as `p4-browser.json`.

The original report remains useful for its separately collected cold-load/resource evidence. Its initial aggregate 17.1 ms p95 must not be presented as the accepted final browser latency. The correction changes only local instrumentation; no production source or artifact changes.

Primary-agent retest: 56 native edits (20 objective, 20 deadline, 16 eligibility), every comparison/recommendation check matched and no failures. Corrected p50 12.6 ms, p95 19.6 ms, max 21.9 ms. Every eligibility sample records `startEvent: click`; all select samples record `startEvent: change`. This passes the 100 ms p95 budget using the disclosed render-opportunity proxy. All original samples remain preserved. No second independent review is claimed.

## Independent checks and limits

The reviewer reproduced all initial percentile arithmetic and counts, confirmed the 30-job fixture, cold-load entries and transfer total, and verified every export SHA-256/size (29 files, 1,246,753 bytes). H3 approval and pending H4 were consistent. No additional material finding was reported.

The reviewer read the persona and standard fully, target and supplied scripts/components, planner entry/scheduler, package scripts, measurement files, demo, README, implementation plan, notices and installed React dispatch implementation. It did not execute a browser, rebuild, rerun tests or independently observe the offline check. The primary agent owns correction/retest evidence in docs/validation.md; this is not a second independent sign-off.

## October 30 release follow-up — primary-agent review only

The user requested reexamination before a public post and then authorized local finishing work, retaining hosting setup. The primary agent traced scheduling, accounting, validation, UI state, data preparation and release configuration, and reran checks. No new scheduling/accounting defect was reproduced. Two concrete public-demo gaps were addressed: additions previously required a reload to undo, and metadata used a different name with no sharing image. Removal/reset and sharing assets now have state/configuration tests and a verified static export. No new dependency, dispatch behavior, data source or planner interface was introduced.

Reviewed removal to empty, invalid-draft removal/reset, capacity release, selection fallback, full-batch removal/re-addition, and configured/unconfigured metadata. All 87 TypeScript and 11 Python tests pass; build/standalone checks pass. Fresh Node timings meet the existing budget. The original prototype and historical benchmark/review artifacts remain intact. Exact fresh evidence is in docs/validation.md, with new manifests under docs/benchmarks/p4-release-*.json.

Outstanding: fresh browser visual inspection (browser host unavailable), actual hosting configuration, live URL smoke test and platform link-preview behavior. This addendum is a primary-agent self-review, not another independent Goldfish review or a claim of deployment readiness beyond the documented checks.
