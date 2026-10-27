# P1 evidence: data and reusable contract

October 27, 2026. User approved starting implementation (H0). Work is on `feat/p1-data-contract`; existing plans and UI prototype are preserved. **H1 remains pending.** No P2 scheduler, map/heatmap integration, AI, deployment or competition submission is implemented.

## Delivered boundary

- Create: `scripts/prepare_data.py`, pinned `scripts/requirements.txt`, `data/scenario.json`, `data/README.md`, `tests/test_prepare_data.py`.
- Create: `src/planner/types.ts`, `validate.ts`, `index.ts`, `tests/contract.test.ts`, `tests/fixtures.ts`, `examples/result-shape.ts`.
- Create: the Next.js static shell in `src/app/`, package/lockfile, TypeScript, Next, Tailwind/PostCSS and Vitest configuration, `.node-version` and `.gitignore`.
- Modify: current status/commands in README, AGENTS, design and implementation plan. Preserve `output/` and the prior design review report.

Historical data passed: 120 aligned carbon values, five original regions, July 2 UTC. July 1 failed one missing MISO value; first-complete-day selection is independent of scheduling. Exact unit conversion, reporting-zone mappings, quality checks, source URLs/hashes and reproduction commands are in [data provenance](../data/README.md).

## Public API available now

`src/planner/index.ts` exports request/result types and `validateScenario(unknown): ValidationResult`. It has no Next, React, DOM, network or AI dependency. **`planScenario` is not exported yet; P2 implements it after H1.**

The request is [data/scenario.json](../data/scenario.json). `schemaVersion=1`, `intervalHours=1`, `startUtc`, `scenarioId`, `objective`, `provenance`, five regions and at most 30 jobs are required. Exact nested names/types are in [types.ts](../src/planner/types.ts); that file is the authoritative contract declaration, not a second roadmap.

Runtime validation accepts plain JSON-shaped objects, rejects missing/unknown fields, wrong primitive types, unsupported versions, malformed lists, sparse arrays, duplicate/unknown IDs and nonfinite numbers. Each rejection has a field path and reason. Successful validation returns an independent clone, normalizes `startUtc` and `preparedAt` to UTC ISO strings, and leaves caller input untouched. Timestamps require a valid calendar date, seconds and explicit `Z` or numeric offset (up to three fractional second digits); local timestamps are rejected. Display timezones must be recognized by the runtime's Intl data.

All signal/capacity arrays have 24 entries. Signals accept finite signed numbers or explicit null; capacities are nonnegative safe integers. Jobs require release 0–23, deadline 1–24 strictly after release, duration 1–24, positive safe-integer GPUs and positive finite facility kW. Empty jobs and empty eligibility are valid. A too-long job window or excessive GPU demand is a normal P2 non-placement, not malformed input. Version 1 classifies price/capacity/jobs as synthetic; historical carbon references require HTTPS URLs and SHA-256 strings, synthetic sources require null URL/hash. All five carbon classifications must match scenario mode. These checks validate declared provenance structure, not the authenticity of arbitrary external sources.

The hand-worked [result shape](../examples/result-shape.ts) is typechecked. It illustrates one pinned 100 kW, two-hour job at 100 USD/MWh and 400 g/kWh: 200 kWh, $20, 80 kg, identical across policies. It is **not solver output**, and does not describe the bundled historical scenario. For that illustration release=0, deadline=2, duration=2, home/eligibility=CISO, sufficient capacity, so each policy has one feasible candidate.

The P2 result contract includes three independent policies (`earliestHome`, `waitHome`, `regionAndTime`), full-window assignments, candidate alternatives captured before reservation, typed unplaced reasons, counts and totals. `NO_ELIGIBLE_REGION` means the policy's allowed regions intersect job eligibility to an empty set (including excluded home); `WINDOW_TOO_SHORT` means duration exceeds release-to-deadline; `NO_FEASIBLE_WINDOW` covers missing signals/capacity under current reservations. This precedence is deterministic. Candidate alternatives include the selected candidate and every other feasible candidate for that policy at that job's turn; earliest-home still ranks by earliest start. IDs sort by code-point order, not locale. Comparison reference is waitHome; all three completed-ID sets must be equal and nonempty. Incomparable savings are null; valid deltas are reference minus chosen; percentages are null for nonpositive reference totals. P2 must ensure totals remain finite, including overflow from extreme finite caller inputs, before returning JSON.

P2 will export `ScenarioArithmeticError extends Error`, implementing the exported `ArithmeticFailure` shape: `name = "ScenarioArithmeticError"`, `code = "NONFINITE_ARITHMETIC"`, and a nonempty `path` identifying the failed numeric field (for example `policies.waitHome.assignments[0].energyKwh`). If evaluating any otherwise-feasible candidate, summing a policy, or calculating a comparison produces a nonfinite value, abort the entire call with this error and return no partial plan. Do not drop that candidate, mark work unplaced, clamp values, or serialize Infinity/NaN. Invalid input still throws the separately planned `ScenarioValidationError`; valid-but-unplaceable work still returns the declared unplaced reason. Acceptance cases in P2 must include a two-hour job at `Number.MAX_VALUE` kW, a finite per-job total overflowing when summed, and an overflowing comparison difference/percentage. This freezes behavior; no arithmetic error is raised by the P1 validator for otherwise valid finite input.

## Verification recorded

On Windows, Node 24.21.0, npm 11.19.0, Python 3.14.8:

| Command | Outcome |
|---|---|
| `npx vitest run tests/contract.test.ts` | 31 passed, including actual Python-produced snapshot and malformed source URLs |
| `.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_prepare_data.py` | 11 passed, including corrupt-download failure preserving output |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; static `out/index.html` generated |
| Historical preparation CLI | Passed; July 2, all five × 24; original snapshot has no missing/negative values |
| Exported site in Brave at 127.0.0.1:3010 | Loaded labels and all five 24/24 rows; desktop rendering inspected; no application console errors observed |

The first validator run produced six meaningful failures against the stub, then passed after implementation. Preparation fixtures failed on unimplemented behavior, then passed. The added chronological selection test failed before its implementation and now proves that a later cleaner day cannot displace the first complete day. Tests cover workbook unit/hour-ending conversion, MISO summer alignment, malformed coverage, explicit modes, deterministic prices, failed historical CLI preserving existing output, and validated atomic writes. No claim is made that each rejection assertion separately failed against an always-rejecting stub.

Pinned direct npm versions: Next 16.4.3, React/React DOM 19.3.1, TypeScript 7.0.2, Vitest 5.0.5, Tailwind and its PostCSS adapter 4.3.3, @types/react 19.3.0, @types/node 26.6.5. Lockfile captures transitive dependencies. npm install reported zero vulnerabilities at installation; that is not a security audit. [Next static export behavior](https://nextjs.org/docs/app/guides/static-exports).

This shell uses system fonts. The accepted free fonts, D3 utilities, map and actual heatmap arrive only when needed in P3. No UI latency measurement or planner portability smoke test is claimed yet; those require P2/P3. Source parsing time is a preparation concern, not dashboard interaction latency.

## Review and human decision

EGM review completed with fresh-context Codebase Details and Implementation Readiness reviewers. They found two Major items (URL syntax validation; undefined arithmetic-overflow response) and one Nit (manual versus automated unit verification). All three are corrected within P1's scope; the URL regression was observed failing before its fix, then passed. [Annotated report](reviews/p1/goldfish_review_report.md) records the original findings and primary-agent resolution. Corrections have not undergone a second independent review round. The prior root design report is preserved.

H1 asks the user to approve these historical/synthetic labels, fictional pool mappings, declared contract and data-quality selection rule before P2 begins. This checkpoint is required by the user's phased plan, not by an added deployment or installation restriction.
