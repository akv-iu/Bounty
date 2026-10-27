# Project handoff

P3 interactive map, heatmap, batch editor and linked comparisons are implemented and verified. H0-H3 are approved; P4 verification is complete and H4 is required before deployment. See docs/validation.md for P4/P3/P2 evidence and docs/p1-validation.md for P1 history. Preserve the existing synthetic UI prototype in output/.

## Read first

1. Initial/Implementation_Plan.md — current phase, tasks, human gates and decision record.
2. Initial/Design_Proposal.md — product behavior, units, scheduling and comparison rules.
3. Initial/UI_Direction.md — accepted visual direction and intended heatmap.

Initial/Project_Spec.md is historical background. output/ is a single-job UI prototype, not the production planner or evidence of real energy savings.

## Execution rules

- Work in phases. Respect `[HUMAN CHECK REQUIRED]` gates from the current plan; present completed evidence before requesting a decision. Do not infer approval from silence. Explicit user authorization for multiple phases persists.
- Keep phase status and decisions current in the existing plan. Do not create a competing roadmap or duplicate full design documents here.
- Preserve a browser/framework-independent planner with a single public entry point. Use consistent explicit units and UTC intervals.
- Keep historical/provider-estimated, synthetic and calculated values distinct. Do not show aggregate savings for different completed job sets.
- Heatmap inspection does not reschedule. Optional AI cannot block manual planning or supply calculations.
- Latency budgets are targets until measured. Record actual device/browser/scenario and results.
- Use tests for meaningful scheduling, accounting, input validation and state transitions; inspect visual-only changes in the browser. Do not test prose or duplicate implementation details.
- Installed verification commands: `npm test`, `npm run typecheck`, `npm run build`; Python: `.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_prepare_data.py`. Setup and raw-data reproduction are in data/README.md. Standalone planner: `npm run smoke:planner`; worked cases: `npm run demo:planner`; Node timing: `npm run benchmark`. These compile native ESM through `npm run build:planner`. P4 browser measurements are in docs/benchmarks/p4-browser.json; see docs/validation.md for protocol limits.

EGM artifact directory for this phase: docs/reviews/p4/. Keep the previous root goldfish_review_report.md as historical design evidence.

Use Superpowers for phase task planning/execution when available and Ponytail to keep scope small. User instructions and actual approval decisions override skill defaults. Do not force two overlapping planning workflows or restart already accepted product discovery.
