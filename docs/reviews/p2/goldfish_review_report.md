# P2 Goldfish / senior code review

Date: October 27, 2026. Base: P1 `f2acb29`. Scope: uncommitted P2 implementation on `feat/p2-planner`, including new files. One fresh-context reviewer used the installed EGM Codebase Details persona and Re-Implementation standard alongside the Superpowers senior code-review template. The reviewer was read-only and did not execute checks. The primary implementer performed the recorded runtime verification.

## Reviewed

`docs/validation.md` lines 1–68 as supplied at review time; AGENTS.md; accepted P2 plan, public contract and latency protocol; scheduling/comparison design; src/planner; contract/planner tests; build/smoke/demo/benchmark scripts; compiler/package configuration; worked examples and benchmark samples.

Whole-window eligibility, deadlines and capacity reservation match the accepted model. Policies and calls isolate their capacity state. Comparisons require matching completed IDs across all three policies, with null savings for empty or mismatched work. Arithmetic failure aborts the call. Alternatives preserve decision-time candidates. Historical no-extra-geographic-benefit results and the retained benchmark samples support their claims. Native ESM compilation and keeping the small internal helpers together are reasonable documented adjustments.

## Finding and disposition

| ID | Severity | Evidence and smallest fix | Status |
|---|---|---|---|
| P2-01 | Minor runtime issue; EGM rubric classifies the direct documentation contradiction as Blocker | A valid `releaseSlot: -0` was copied into candidate `startSlot` at schedule.ts:53. JSON serialization converts it to positive zero, contradicting the normalization/round-trip guarantee in validation.md. Normalize zero when constructing the candidate and test assignment, alternative, input preservation and round trip. | Fixed by primary implementer after reproducing the failing test. Targeted test and full 63-test TypeScript suite pass. |

The reviewer found no important scheduling, reservation, comparison or portability defects by inspection and considered the phase ready after the small fix and final checks. Its verdict was conditional on that correction, not an independently verified post-fix approval. No second reviewer was run for the one-line correction or subsequent status/document updates.

## Declined to judge

- Browser interactions, accessibility and browser latency: P3/P4 work.
- Real dispatch, live capacity and realized savings: outside the accepted simulator scope.
- Global optimization: the accepted algorithm is greedy.
- Pending verification fields: accurately labeled at review time.
- Prior red/green execution: the reviewer inspected tests and claims, not execution logs.
- Arbitrary floating-point precision beyond the finite-output contract: not a specified guarantee.

## Final evidence and gate

The primary implementer ran the full TypeScript and Python suites, typecheck, production build, standalone public-entry smoke, asserted worked examples and final benchmark. Exact outcomes and measurement limits are in [validation.md](../../validation.md). H2 remains a human decision before P3; static review and passing tests do not grant it.
