# Bounty

Energy-aware planning for flexible AI workloads, built for the Torus hackathon.

**Status:** P1–P3 are approved; P4 performance, offline and release checks pass, with the independent review finding corrected and retested. **H4 deployment approval remains pending.**

The bundled snapshot contains 120 EIA consumption-carbon estimates for July 2, 2026 across five regions. Prices, workloads and capacity are synthetic. The engine calculates illustrative schedules; no real jobs are dispatched or realized savings measured.

## Run locally

Use Node 24.21.0 (see `.node-version`).

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. `npm test`, `npm run typecheck` and `npm run build` verify the current implementation; the build exports `out/`. The existing `output/preview.html` remains the earlier visual prototype. The production dashboard is the Next.js app, not that prototype.

Try shortening the selected job's deadline, restricting eligible regions or selecting "No spare GPUs." Map/heatmap selections inspect the resulting plan without rescheduling; the carbon/price view toggle is separate from scheduling priority. Invalid drafts are labeled and preserve the previous valid result. Fonts, map and scenario are bundled locally.

## Use the planner independently

The public entry point is `src/planner/index.ts`; it has no React, Next.js, DOM, network or AI dependency. It validates inputs and returns three independently scheduled policies, retained alternatives and comparison eligibility. It uses a deterministic greedy policy, not a globally optimal solver.

```typescript
import { planScenario, validateScenario } from "./src/planner/index.ts";

const validation = validateScenario(input); // input is parsed scenario JSON
if (!validation.ok) throw new Error(JSON.stringify(validation.issues));
const result = planScenario(validation.value);
console.log(result.policies.regionAndTime.assignments);
console.log(result.comparison); // savings are null when completed job sets differ
```

Malformed calls throw `ScenarioValidationError`; nonfinite calculations throw `ScenarioArithmeticError`. Valid jobs with no placement appear in `unplaced`. Units and UTC interval boundaries are explicit in the [public contract](src/planner/types.ts).

`npm run build:planner` produces native ESM and declarations in `dist/planner/`. Node 24 can import `dist/planner/index.js` directly. No server is needed.

```powershell
npm run smoke:planner  # compile and exercise the public entry in plain Node
npm run demo:planner   # regenerate asserted teaching examples and historical summary
npm run benchmark     # 30 jobs, 5 regions, 24 slots; retained samples and environment
```

- [P4 measurements and offline checks; P3 screenshots and P2 history](docs/validation.md)
- [Demo walkthrough, browser timing reproduction and proposed deployment](docs/demo.md)
- [Independent P4 review and timing correction](docs/reviews/p4/goldfish_review_report.md)
- [Independent P3 review and fix disposition](docs/reviews/p3/goldfish_review_report.md)
- [Independent P2 review and fix disposition](docs/reviews/p2/goldfish_review_report.md)

- [P1 evidence and H1 decision](docs/p1-validation.md)
- [Data provenance and optional Python reproduction](data/README.md)
- [Public contract](src/planner/types.ts)
- [Hand-worked result shape (not scheduler output)](examples/result-shape.ts)

- [Phased implementation plan and human checkpoints](Initial/Implementation_Plan.md)
- [Superpowers plan critique and corrections](Initial/Plan_Review.md)
- [Product design and scheduling rules](Initial/Design_Proposal.md)
- [UI direction](Initial/UI_Direction.md)
- [Standalone synthetic UI preview](output/preview.html)

The preserved preview uses one synthetic workload and the earlier plain timeline. The actual app has the map, heatmap and batch editing flow. P4 measured 30-job planner p95 below 6 ms in Node and native browser edit-to-render-opportunity p95 of 19.6 ms across 56 edits. These are local laptop results with a documented timing proxy, not a network or GPU execution guarantee. Loaded-page exploration works with the origin server stopped; offline reload and edit persistence are not supported. Deployment is pending. AI is optional and disabled.
