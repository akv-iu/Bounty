# Bounty

Energy-aware planning for flexible AI workloads, built for the Torus hackathon.

**Status:** P2 reusable scheduling engine is implemented. **H0 and H1 approved; H2 review pending before the interactive dashboard.**

The bundled snapshot contains 120 EIA consumption-carbon estimates for July 2, 2026 across five regions. Prices, workloads and capacity are synthetic. The engine calculates illustrative schedules; no real jobs are dispatched or realized savings measured.

## Run locally

Use Node 24.21.0 (see `.node-version`).

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. `npm test`, `npm run typecheck` and `npm run build` verify the current implementation; the build exports `out/`. The app is still a static foundation page. The existing `output/preview.html` remains the earlier visual prototype.

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

- [P2 validation, worked outcomes and H2 evidence](docs/validation.md)
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

The preview uses one synthetic workload and still has the earlier plain timeline. P3 adds the map, heatmap and editing flow. Node engine latency is measured in the P2 report; browser responsiveness and deployment remain unverified. AI is optional and disabled.
