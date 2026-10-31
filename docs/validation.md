# Implementation validation

## October 31, 2026 — Cloudflare static deployment correction

The supplied cloud build log completed Next.js compilation, TypeScript and static export, then failed inside OpenNext with `ENOENT` for `.next/standalone/.next/server/pages-manifest.json`. Without a Wrangler configuration, `npx wrangler deploy` auto-configured a Next.js server deployment even though this application uses `output: "export"`.

Added `wrangler.jsonc` for the log's existing `bounty` Worker, with `assets.directory` set to `./out` and static 404-page handling. No server entry point, OpenNext adapter, dependency change or application-code change is needed. Updated the publishing instructions for this Git-connected Worker and retained Pages Direct Upload as an alternative.

Verification on Windows with Node v24.21.0 and npm 11.19.0:

| Check | Result |
|---|---|
| `npm run build` | Passed, including TypeScript and static export |
| `npm test` | All 87 tests passed across four files |
| `npx --yes wrangler@4.156.0 deploy --dry-run` | Passed; Wrangler read 40 files from `out/`, completed packaging and exited without deployment or OpenNext setup |
| Export spot check | `index.html`, `404.html`, `social-card.png` and `icon.svg` present |
| `git diff --check` | Passed |

No Cloudflare account settings were changed, no assets were published, and no push was performed because the connected branch can trigger publication. Account permissions, the final `SITE_URL`, public routing and live browser behavior remain unverified. The user should publish the corrected commit using the settings in [the hosting handoff](demo.md#existing-git-connected-worker--october-31-correction), then perform its public-URL checks. Existing browser-review limitations remain unchanged.

Follow-up: the second supplied cloud log (15:05–15:07 UTC) repeated the same auto-migration failure. Inspection confirmed the correction was still uncommitted locally and remote `main` remained `7da173c755b72aae59e41dd120b4b1b634f46e8c`. The fix had not reached the cloud build. In response to the user's instruction to finish the correction after the commit/push handoff, prepare and push the verified configuration to the existing integration. The previously passing code and configuration are unchanged; deployment success must be checked separately from those local results.

## October 30, 2026 — local release follow-up

The user authorized necessary finishing work and asked to retain hosting/public-URL setup. The agent has not published or configured a hosting account. The handoff is in [docs/demo.md](demo.md#publish-it-yourself--october-30-handoff). This section supersedes the October 27 artifact counts for the current source; earlier timing/review evidence is retained below as historical evidence.

### Changes and verified behavior

- Added **Remove selected job** through the existing validated planner commit. It updates all policy results and capacity, selects a remaining job, handles the final-job empty state, and permits additions again at the 30-job limit. Removing an invalid selected job can recover the batch. Other invalid drafts still preserve the accepted plan if validation fails.
- Added **Reset demo**, restoring original jobs, objective, capacity, job/preset selection, inspected region/hour and carbon shading. It also clears invalid drafts. The UI now states that reload/reset restores the original demo; no persistence was added.
- Aligned the title/description with Sunward, added an SVG favicon and a 1200 × 630 PNG sharing card. The card was rendered and visually inspected. It uses the already bundled IBM Plex Mono font; no new package or external asset request was added. The initial DM Sans rendering attempt failed on the variable font; the final generator uses the supported existing mono font and passes its PNG/dimension assertions.
- Added optional build-time `SITE_URL`. Configured exports contain canonical, Open Graph and Twitter image URLs for that HTTPS origin. Unconfigured local builds omit host-specific URLs rather than embedding localhost or a speculative production domain. Invalid URLs, credentials, non-HTTPS origins, paths, queries and fragments fail validation. The final `out/` is unconfigured; the user must rebuild with their actual public origin before final upload.
- Planner source, historical scenario, dependencies and the preserved `output/` prototype are unchanged.

### Fresh checks

| Check | Result |
|---|---|
| `npm test` | 87 passed: 31 contract, 32 planner, 16 UI, 8 metadata checks |
| `npm run typecheck` | Passed |
| Python `unittest discover -s tests -p test_prepare_data.py` | 11 passed |
| `npm run smoke:planner` | Passed through the standalone native ESM entry |
| `node scripts/demo_planner.cjs` | Four teaching situations verified; historical summary and generated examples unchanged |
| `npm run build` without `SITE_URL` | Passed; local export has no placeholder origin or localhost metadata |
| Build with `SITE_URL=https://sunward.example` | Passed; HTML assertions verified canonical, `og:url`, `og:image` and `twitter:image`; reserved example origin used only for validation, then removed by a final unconfigured build |
| Export assets | All root-relative HTML asset references resolve locally; card, icon, map and font/license files are packaged |
| Sharing-card generator | PNG signature and 1200 × 630 dimensions asserted; output visually inspected |
| `npm audit --json` | Zero reported vulnerabilities, including development dependencies; not a comprehensive security assessment |
| Credential-pattern scan | No matches for the scanned provider-key/private-key patterns in src/public/out/data snapshot/scripts; not a guarantee of absence |
| `git diff --check` | Passed |

Fresh Node benchmark: same two five-region, 24-slot, 30-job fixtures; 20 warmups and 200 retained samples each, including validation and all three policies. Feasible: p50 **1.053 ms**, p95 **2.040 ms**, maximum **3.507 ms**. Saturated: p50 **0.359 ms**, p95 **1.078 ms**, maximum **2.152 ms**. Both pass the 50 ms p95 target. [p4-release-node.json](benchmarks/p4-release-node.json) retains exact requests, environment and every sample; the original p4-node.json was preserved unchanged.

Final local export: **31 files / 1,314,857 raw bytes**. [p4-release-export.json](benchmarks/p4-release-export.json) records sizes and SHA-256 hashes; this is a local build with `SITE_URL` unset. Rebuilding for the actual public origin necessarily changes the HTML and some hashes. The historical 29-file manifest below does not describe this version.

### Verification limits and release disposition

Fresh browser inspection was unavailable: the browser inventory returned **“The browser access host is unavailable.”** The prior turn also stopped native browser control because it could not establish the current URL reliably. No access check was bypassed and no fresh desktop/mobile visual or edit-to-render timing pass is claimed. The 87 automated tests include DOM state transitions but do not establish visual layout or screen-reader usability. Earlier October 27 browser results apply to the earlier UI, not the new action controls.

The local implementation and automated verification are complete. Before a company-tagging post, the user should perform the short desktop/narrow-screen and live-URL checklist in docs/demo.md, including sharing metadata and reset/removal. Public hosting, actual CDN loading, platform preview caching and public URL checks remain unverified. The tool is a simulator: no live dispatch, actual cloud GPU bills, globally optimal fleet scheduling or realized emissions savings are claimed. Optional AI remains disabled. This follow-up was reviewed by the primary agent; no new independent EGM sign-off is claimed.

## P4 — performance and release preparation, October 27, 2026

H3 was approved by "push and implement next". P3 commit `1317b660b3f9f4215157eaac5b1b8d8ad25bd971` is pushed to `origin/feat/p3-dashboard`. P4 work is on `feat/p4-release`; no production component, planner, dependency or data change was needed. H4 is pending before any deployment.

### Release checks

| Check | Result |
|---|---|
| `npm test` | 75 tests passed: 31 contract, 32 planner, 12 UI |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; static `out/` generated |
| Python `unittest discover -s tests -p test_prepare_data.py` | 11 passed using the project venv |
| `npm run smoke:planner` | Passed outside React/Next/Vitest |
| `npm run demo:planner` | Four teaching situations asserted; generated results unchanged |
| `npm audit --omit=dev` | Zero reported production-dependency vulnerabilities; not a comprehensive security audit |
| Production browser | Default classification and CISO 19:00–23:00 recommendation render; deadline edits update recommendation/comparisons; instrumentation absent from clean export |
| Offline after load | Origin server stopped and port confirmed closed. Priority change still matched the planner; Texas/23:00 inspection and price shading worked; zero capacity showed 0/30 in every row and no comparable work; restoring capacity recovered MISO placement and appropriate unequal-completion warning |

The earlier browser-host interruption was infrastructure failure, not an application failure. This retry used native Computer Use in the existing Brave window; no browser protection was bypassed.

### Measured latency and protocol

Reference laptop: Windows 10.0.26200 x64, Intel Core Ultra 7 155H, 22 logical CPUs, approximately 15 GiB RAM. Node 24.21.0; Brave with Chromium user agent 156.0.0.0, desktop viewport 1920 × 917 at DPR 1. The browser run was foreground, unthrottled CPU and loopback HTTP. Other normal desktop apps remained open. These are local lab results, not mobile-device or internet-load guarantees.

| Scenario | Samples | p50 | p95 | Maximum | Budget |
|---|---:|---:|---:|---:|---|
| Node, 30 feasible jobs / 5 regions / 24 slots | 200 after 20 warmups | 3.349 ms | 5.824 ms | 10.149 ms | Pass ≤50 ms p95 |
| Node, same size, zero capacity | 200 after 20 warmups | 1.607 ms | 2.643 ms | 6.701 ms | Pass ≤50 ms p95 |
| Browser, native committed edit through render opportunity | 56 | 12.600 ms | 19.600 ms | 21.900 ms | Pass ≤100 ms p95 using stated proxy |
| Browser, separate planner oracle on edited requests | 56 | 2.300 ms | 4.900 ms | 6.600 ms | Supplemental; different workload from Node fixture |

Node includes validation and all three policies. The run overlapped build/test processes; retain those observed samples rather than presenting them as idle-machine results. [p4-node.json](benchmarks/p4-node.json) keeps both exact fixtures and every sample; P2 evidence is preserved separately.

The browser fixture retains the original three jobs and adds 27 copies of `batch-eval`, all released at 0 with deadline 24, four-hour duration, 16 GPUs and 8 kW; original region capacities/signals remain intact. The 56 trusted native events comprise 20 objective switches, 20 original-job deadline changes between 1 and 24, and 16 CISO eligibility toggles. Short deadlines exercise unplaced/recovered results. No samples were discarded, no overlap/hidden-tab/mismatch failures occurred. [p4-browser.json](benchmarks/p4-browser.json) retains initial inputs, each edited job/objective, all samples and resource entries.

The external local probe starts at a native select `change` timestamp or checkbox `click` captured at document capture phase, before React processes the checkbox. It timestamps completion at a timer task after requestAnimationFrame. This is a **post-render-opportunity proxy**, not an exact physical-display measurement or INP; the 100 ms target is not claimed as a hardware input-to-photon guarantee. After timing, it recalculates through the standalone public planner and checks the selected-job recommendation/window, heatmap outline and all three comparison rows in the DOM (some are below the viewport). Oracle computation is outside the reported UI interval. The probe runs alongside the unchanged production JavaScript and is absent from the shipped export.

Independent EGM review found that the first probe timed checkboxes from the later native `change`, excluding their earlier React scheduling. That initial aggregate is superseded, preserved without editing as [p4-browser-initial.json](benchmarks/p4-browser-initial.json). The probe was corrected and all 56 native edits repeated; the table reports only the corrected run. No samples from either run were deleted. Final per-control p95: objective 17.1 ms, deadline 16.5 ms, eligibility 21.9 ms. [Review and disposition](reviews/p4/goldfish_review_report.md) distinguishes the independent finding from primary-agent retesting.

An additional offline priority edit in the initial run matched at sample 57; it is functional smoke evidence only. The clean, uninstrumented export was also checked with its server stopped: at deadline 12/cost priority its wait-home result was 10.75 kg/$3.32 and regional choice 30.04 kg/$3.10, matching a separate Node calculation through the public entry point. Default controls were restored afterward.

No missed target justified a worker, caching layer or scheduling rewrite. The app and planner source remain unchanged.

### Cold-load and artifact evidence

First visit to the new loopback origin `127.0.0.1:4174`, with `Cache-Control: no-store`, unthrottled CPU/network: first contentful paint **816 ms**, DOM interactive **830.7 ms**, DOMContentLoaded **910 ms**, load event end **1077.5 ms**. These load/resource entries are retained in p4-browser-initial.json and are unaffected by its checkbox-timing defect. This is one cold HTTP-cache visit with the local observer and oracle modules loaded, not a statistically representative CDN or low-end-device result. The browser process itself was already running. The corrected interaction run's separate navigation entries remain in p4-browser.json; they do not replace this first-visit evidence.

Navigation plus ten successful production resource requests transferred **1,063,104 bytes** under the local uncompressed server (including its small injected HTML script tag; excluding probe/oracle resource requests). The two bundled TTF fonts contribute 375,744 body bytes; map SVG 122,805 bytes. The complete unmodified export has **29 files / 1,246,753 raw bytes**, including route/data/license assets not all needed at first load. [p4-export.json](benchmarks/p4-export.json) records each size and SHA-256. Compression and edge latency must be measured at the actual P5 URL. The optional missing favicon request returned 404; it did not affect app behavior.

Font OFL notices, map attribution and EIA classification/date are included. Pattern scanning found no provider credentials/private keys in src/public/out/data/scripts; this is not a comprehensive security audit. No runtime data fetch, paid service, AI or dispatch is introduced. Historical default geographic savings remain zero; unequal completed sets suppress aggregate changes. [Demo and reproduction](demo.md) covers the four synthetic situations separately.

### H4 decision

Proposed deployment: Cloudflare Pages Direct Upload project `sunward-akv-bounty`, URL `https://sunward-akv-bounty.pages.dev`, using only `out/`. This destination is proposed, not created; account access and name availability remain unverified. See [demo.md](demo.md) for checked provider documentation and deployment limits. H4 requires accepting this evidence and authorizing that destination before P5. AI and competition submission remain separately gated.

## P3 — interactive dashboard, October 27, 2026

H2 is approved by "push and continue". P2 commit `d859f10` is pushed to `origin/feat/p2-planner`. P3 is implemented and verified on `feat/p3-dashboard`; H3 was subsequently approved and P3 pushed at `1317b66`. The original output/ prototype is preserved. No deployment has occurred.

### State and interaction contract

`PlannerDashboard(initialRequest: PlanRequest)` owns one accepted request/result pair, an editable draft, validation/calculation error text, selected job/region/hour, heatmap measure, capacity preset and workload-preset selection. The validated bundled request enters from the server page. Initial rendering calculates all three policies through the existing public planner; planner source is unchanged in P3. Child components receive that same result or its derived values.

Deadline, eligibility, priority and capacity edits validate a new draft, call the public planner and atomically replace the accepted request/result only on success. Deadlines are selectable UTC boundaries 1–24; a deadline before release is a visible validation error, whereas a valid but too-short window is an unplaced result. Invalid drafts remain visible in the controls with an alert that map, recommendation and comparisons still show the last valid plan. Discard resets the draft/capacity control to that accepted plan without recalculation. Calculation errors also preserve the previous accepted plan. No persistence or dispatch occurs.

Region, hour, selected job, scrubber and heatmap-measure changes only inspect the accepted result; none calls the planner. Initial selection is the first input job, its home region and hour zero. Carbon is the initial heatmap measure. Priority is separate from heatmap measure. Selected-job edits preserve its release hour. Capacity presets either restore each region's original input capacity or set every slot to zero. A status line identifies changed chosen-policy placements and all unplaced jobs after edits.

Every UTC time label derives from the scenario start plus its slot offset, including the map, scrubber, editor, heatmap, assignment and alternative views. A `(+1d)` suffix distinguishes the next UTC date; non-midnight starts remain correct. Local time labels independently use the region's IANA zone. Scheduling still uses unchanged integer slot boundaries.

Workload presets reuse the original batch's requirements; the default is its first job. Adding copies the selected preset with a collision-free suffixed ID, release equal to the inspected hour and deadline equal to release + max(6, duration). Out-of-horizon deadlines are rejected visibly; no clamping or silently shortened deadline. Rejected additions leave the batch and selection intact. Successful additions select the new job. The button disables at 30 jobs, and shared validation also enforces that limit. Empty initial batches have no available presets; the component shows an empty state, while the shipped snapshot always has three presets.

### Display rules

- RegionMap shows the inspected region/hour, local date/time using its IANA zone, source-classified carbon, synthetic electricity price and spare GPUs. Native region/hour selectors provide equivalents to pins and cells. Pins are representative pools using the accepted prototype's fixed map projection, not cloud locations or grid boundaries.
- RegionHeatmap uses five rows and 24 UTC hours, a shared min/max across all regions for the selected signal, a common green-to-amber scale, a single-value constant legend and hatched × cells for missing values. Signal shading does not encode capacity. Only the selected job's full chosen-policy window is outlined; a dot marks inspection. Each cell is a labeled native button. The heatmap has local horizontal scrolling and sticky region labels.
- Selected-cell capacity subtracts GPU use from every overlapping regionAndTime assignment. Detail lists every overlapping job as a selectable button, including concurrent jobs. Selecting a job changes its recommendation/outline, not the inspected hour or plan.
- JobDetail displays the selected assignment, whole-run units, feasible candidate count and actual retained alternatives. It prefers the best alternative in another region; otherwise the best different start. Explanations name objective and deterministic tie order, plus the independent wait-home result. No placement uses the planner's typed reason.
- ComparisonTable reads all three policy totals/counts directly. Aggregate change references waitHome and is shown only when the engine marks completed work comparable. Absolute magnitudes are labeled reduction or increase, preserving negative outcomes; percentages are omitted when null. Empty/different work suppresses all deltas with the engine's comparison reason. Costs are explicitly simulated electricity costs, not GPU bills.
- Header and expandable assumptions distinguish historical provider estimates, simulated inputs, hindsight and calculated results. No AI, live feed, migration, execution button or savings guarantee is added.

### Assets and dependencies

The accepted map SVG is extracted to public/us-map.svg with its HTML-only attribute removed so it parses as standalone SVG. The fixed geometry avoids adding a runtime D3/TopoJSON dependency. DM Sans and IBM Plex Mono TTF files and their SIL OFL notices are bundled under public/fonts; map/font/EIA credits are in public/notices.txt. Both original prototype files are unchanged. No runtime package is added.

UI tests add pinned dev dependencies: @testing-library/react 16.3.3, @testing-library/user-event 14.6.8 and jsdom 30.1.3. Vitest includes .test.tsx files; only the UI file selects jsdom, preserving Node engine checks. Tests render the actual dashboard against small five-region fixtures, exercise DOM controls, spy on the real public planner for inspection-call invariants and clean up between cases. Setup follows the [Testing Library guide](https://testing-library.com/docs/react-testing-library/setup/) and [Vitest per-file environment documentation](https://vitest.dev/guide/environment.html).

### Verification and review

The initial eight interaction tests failed against the empty dashboard before implementation, then passed. Three additional cases cover invalid-draft discard, incomparable outcomes and keyboard cell activation. A new capacity-transition assertion reproduced an incorrect "unchanged" status when placements disappeared; the status now compares both old and new assignments. Fresh-context EGM review found a Major mismatch for non-midnight starts: UTC labels used raw slot indices. A failing regression reproduced it; the shared formatter and every caller now derive actual UTC boundaries and distinguish date rollover. That regression passes. The reviewer also identified stale phase records, now updated. Fixes were verified by the primary implementer, not independently re-reviewed; [review scope and disposition](reviews/p3/goldfish_review_report.md).

| Check | Final outcome |
|---|---|
| `npm test` | 75 passed: 31 contract, 32 planner, 12 UI |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; static out/ export generated |
| `npm run smoke:planner` | Passed; standalone entry still works without UI dependencies |
| Browser flow | Deadline, eligibility, capacity failure/recovery, invalid-draft discard, measure/inspection and keyboard checks passed |
| Asset inspection | Standalone SVG parses; map and bundled fonts render; source/license notices included |

The Python pipeline and planner implementation are unchanged in P3; their P2 verification is retained below. No redundant benchmark or Python rerun is presented as new P3 evidence.

### Browser evidence and limits

Inspected the production export served on loopback in Brave on the same Windows laptop as P2. Final desktop DOM viewport was 1920 × 861 (1905 px page width with scrollbar); the narrow test used 390 × 844 (375 px page width). At narrow width the heatmap scrolled within its own 1004 px content area, with sticky region labels and no page-level horizontal overflow. Keyboard Tab/Enter selected the next heatmap cell with a visible focus outline, and ArrowLeft changed the scrubber hour. White selected-job outlines and inspection dots remained distinct. All rendered buttons had no animation and zero-duration transitions; the reduced-motion override is present in CSS. A separate OS-preference toggle or screen-reader audit was not performed.

The historical default shows CISO 19:00–23:00 for batch-eval, 0.83 kg attributed CO₂ and $2.00 simulated cost. Shortening its deadline to slot 12 moves it to 00:00–04:00 and updates the full batch to 10.06 kg/$4.16. Excluding CISO then chooses ERCO and suppresses aggregate deltas because the home-only policies complete different work. Zero capacity shows rejection and "No completed work to compare"; restoring capacity recovers the plan. Selecting CISO at 19:00 lists the scheduled 16-GPU job and 16/32 free GPUs. Simulated-price viewing preserves the recommendation. Automated tests additionally cover concurrent overlapping jobs and flat/missing signals.

Screenshots: [desktop map/editor](screenshots/p3/desktop.jpg), [heatmap](screenshots/p3/heatmap-desktop.jpg), [failure](screenshots/p3/desktop-failure.jpg), [narrow heatmap](screenshots/p3/mobile-heatmap.jpg). No application console errors were observed; the only logged warnings were from an unrelated browser extension. This is a browser functional/visual check, not measured latency or a comprehensive accessibility certification. P4's 50-edit production timing, initial-load profile and offline smoke remain outstanding.

### Human checkpoint

H3 approved via "push and implement next" on October 27, 2026. Use `npm run dev`, or serve the export using `.\.venv\Scripts\python.exe -m http.server 4173 --bind 127.0.0.1 --directory out`. AI and deployment remain separately gated.

## P2 — reusable planner, October 27, 2026

H1 was approved by the user's instruction to move to the next step. P2 is implemented on `feat/p2-planner`, based on P1 commit `f2acb29`; H2 was approved October 27, 2026 via "push and continue". No real compute jobs are dispatched. At the P2 checkpoint the app was still a foundation page; the interactive dashboard is covered in the P3 record above.

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

**H2 approved** October 27, 2026 via "push and continue". P1 remains documented in [its evidence report](p1-validation.md). P2 was pushed to `origin/feat/p2-planner` at `d859f10`. P3 proceeds on `feat/p3-dashboard`.
