# Project handoff

P1 data preparation, request validation and a minimal static Next.js app shell are implemented. H0 is approved; H1 remains pending before P2. See docs/p1-validation.md for evidence. Preserve the existing synthetic UI prototype in output/.

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
- Installed verification commands: `npm test`, `npm run typecheck`, `npm run build`; Python: `.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_prepare_data.py`. Setup and raw-data reproduction are in data/README.md. The scheduler and its benchmark/smoke commands remain P2 work.

EGM artifact directory for this phase: docs/reviews/p1/. Keep the previous root goldfish_review_report.md as historical design evidence.

Use Superpowers for phase task planning/execution when available and Ponytail to keep scope small. User instructions and actual approval decisions override skill defaults. Do not force two overlapping planning workflows or restart already accepted product discovery.
