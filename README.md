# Bounty

Energy-aware planning for flexible AI workloads, built for the Torus hackathon.

**Status:** P1 data pipeline, validation contract and static app shell are implemented. **H0 approved; H1 review pending before the scheduling engine.**

The bundled snapshot contains 120 EIA consumption-carbon estimates for July 2, 2026 across five regions. Prices, workloads and capacity are synthetic. No jobs have been scheduled and no savings measured.

## Run locally

Use Node 24.21.0 (see `.node-version`).

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. `npm test`, `npm run typecheck` and `npm run build` verify the current foundation; the build exports `out/`. The existing `output/preview.html` remains the earlier visual prototype.

- [P1 evidence and H1 decision](docs/p1-validation.md)
- [Data provenance and optional Python reproduction](data/README.md)
- [Public contract](src/planner/types.ts)
- [Hand-worked result shape (not scheduler output)](examples/result-shape.ts)

- [Phased implementation plan and human checkpoints](Initial/Implementation_Plan.md)
- [Superpowers plan critique and corrections](Initial/Plan_Review.md)
- [Product design and scheduling rules](Initial/Design_Proposal.md)
- [UI direction](Initial/UI_Direction.md)
- [Standalone synthetic UI preview](output/preview.html)

The preview uses one synthetic workload and still has the earlier plain timeline. P2 adds the reusable scheduler; P3 adds the map, heatmap and editing flow. Performance targets and deployment remain unverified. AI is optional and disabled.
