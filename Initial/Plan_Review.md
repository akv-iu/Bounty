# Plan critique — installed Superpowers 7.0.1

Reviewed October 27, 2026 using the installed writing-plans skill and verification-before-completion checklist. This is a primary-agent self-review against Design_Proposal.md and UI_Direction.md, not an independent multi-agent review or a production test result.

## Verdict

The plan is suitable to present at H0 after the corrections below. It is not evidence that the proposed data, performance or integrations work. The product direction remains accepted; authorization to start P1 and the choice of execution method remain pending.

## Material findings and changes

| Priority | Finding | Why it matters | Resolution in the plan |
|---|---|---|---|
| High | The original schedule allocated every hour up to 24 | One data or browser problem would displace release verification | Target a 20-hour core/handoff with hours 20–24 reserved for recovery; check progress at hour 14 and cut optional work first |
| High | Performance evidence came only near the end | A slow engine could force UI rework after the implementation was committed | P2 now measures both maximum-size feasible and saturated cases; P4 repeats the benchmark and measures actual browser paint latency |
| High | Equal empty completed-job sets could pass the comparison rule | Scheduling nothing could appear as a valid zero-cost result | Only identical nonempty sets permit aggregate comparisons; all-unplaced and empty requests receive NO_COMPLETED_WORK and null savings |
| High | Five rows with opaque job bars did not account for concurrency | Two valid jobs in one region/hour could hide each other | Keep the selected-job outline; show all concurrent jobs and capacity in selected-cell detail; test two 16-GPU jobs sharing a 32-GPU pool |
| Medium | A test-runner import was the only portability proof | Vitest can hide module resolution or browser/framework coupling | Compile the actual public entry point and run it in plain Node, checking JSON serialization and input immutability |
| Medium | Validation versus infeasibility was underspecified | A legitimate job could become a form/schema error, or invalid data could enter the scheduler | Explicit timezone, slot and size rules; empty jobs, empty eligibility, over-capacity requests and too-short windows have defined outcomes |
| Medium | Synthetic fallback lacked an explicit preparation command | Failure to download might silently become simulated data or leave stale output | Separate historical/synthetic CLI modes; never silently switch; replace a prior dataset only after validation succeeds |
| Medium | Plan steps used test commands before making setup explicit | A missing dependency could be mistaken for the expected failing behavioral test | P1 now establishes and records the runnable environment and minimal static build before interpreting test outcomes |
| Low | Context text said AGENTS.md still needed to be created | Later sessions could recreate or conflict with the existing handoff | Plan now says to update the existing AGENTS.md; plugin status reflects the installed version |

All resolutions above are changes to requirements/tasks, not implemented fixes in application code. Design_Proposal.md and UI_Direction.md were updated where behavior changed so they do not contradict the implementation plan.

## What remains uncertain

- Actual five-region EIA coverage, timestamp/column details and ingestion effort. P1 caps exploration and presents the chosen data branch at H1.
- Whether the full required build fits a particular 24-hour event. The schedule is a target with recovery time; the 48-hour window is not assumed available automatically.
- Measured planner and UI performance on the reference device; initial network load is reported separately.
- Readability of the real multi-job heatmap and responsive layout. The current single-job prototype does not demonstrate these.
- Hosting access and successful deployment. P4 prepares the artifact/destination; P5 verifies the actual hosted app after authorization.
- Optional AI cost, model license and runtime behavior. None is selected or required for the core.

## Superpowers self-review checklist

- [x] Coverage: data provenance/fallback, constraints, three-policy comparisons, heatmap, integration, latency, release and optional AI each have owning tasks and a checkpoint.
- [x] Step clarity: files, public interfaces, explicit outcomes and verification commands are assigned; source-dependent mappings are resolved through inspected evidence at P1/H1.
- [x] Consistency: comparison names/fields, release/deadline semantics and selected-job overlay behavior are shared across the design and plan.
- [x] Failure modes: input mutation, fixed-zone conversion, empty/different completed work, UI inspection/concurrency and stale edited results have explicit checks.
- [x] Scope: one repository and one reusable module; no paid model, service platform, npm publication or real dispatch controller added.

This review did not re-run the earlier EGM reviewers, fetch raw grid data, modify the UI prototype, install application dependencies, run application tests or approve H0.
