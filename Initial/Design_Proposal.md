# Compute Follows the Sun: proposed design

Status: product direction accepted October 27, 2026. P1 has verified five-region historical carbon coverage and implemented the data/validation foundation; H1 remains pending. See ../docs/p1-validation.md for current evidence. The scheduling engine and full interface remain later phases in Implementation_Plan.md.
Prepared October 26, 2026. Budget: one developer, 24–48 hours. Primary track: Torus Option 2.

This proposal replaces the earlier two-region scope recommendation. The original Project_Spec.md remains background. The competition permits labeled simulation and judges creativity, clarity of insight and execution.

## 1. Product and demonstration

Build an interactive planning simulator for an operator placing flexible AI batch evaluation/inference jobs across five existing compute pools. Given a job's deadline, GPU requirement and estimated facility power, show a feasible region and time window, the modeled cost/carbon outcome, and why alternatives lost.

The deliverable is a working scheduler and visual counterfactual, not a cloud deployment controller. Jobs, GPU capacity and power are simulated. Grid carbon conditions should come from historical public records. Prices are explicitly synthetic in the required first version. No actual GPU jobs are executed.

The operator is assumed to control equivalent hardware in all eligible locations. Input data is already present in eligible regions. These assumptions make runtime and power comparable. Jobs stay in one region for their complete execution; no migration, transfer model, checkpointing or battery dispatch.

Five regions are the product target. Proposed pools are California (CAISO/CISO), Texas (ERCOT/ERCO), Virginia-area (PJM), Utah-area (PacifiCorp East/PACE), and Midwest (MISO). Pins represent simulated pools, not verified cloud sites or entire states' grid boundaries. Exact data coverage and mappings must be verified before freezing the dataset.

## 2. Data and what the numbers mean

Use one public grid source, EIA, for a common historical period. Its documentation describes regional downloads containing hourly consumption and production CO₂ estimates. Choose consumption intensity consistently. Use bundled normalized data at runtime; an API key is not needed in the deployed browser for this design. [EIA data documentation](https://www.eia.gov/electricity/930-content/about.html)

Acquisition route: EIA Grid Monitor → Download Data → Balancing Authority/Regional Files → each selected operator's .xlsx workbook → Published Hourly Data. Inspect the actual consumption-intensity column, published unit and timestamp fields before selecting or converting values. Do not assume the six-month balance CSV includes the carbon fields. This source inspection is part of the initial data gate, not a completed integration.

| Input | Required version | Meaning shown in the UI |
|---|---|---|
| Hourly grid carbon intensity | EIA historical consumption estimates if verified; otherwise explicitly synthetic scenario | Provider-estimated historical gCO₂/kWh, or simulated gCO₂/kWh |
| Hourly electricity price | Deterministic synthetic scenario for all five regions | Simulated USD/MWh; not a utility tariff or cloud GPU rate |
| Available GPU count | Deterministic synthetic capacity per region/hour | Simulated homogeneous compute capacity |
| Workload duration, GPUs and power | User inputs and seeded presets | Simulated workload with estimated facility power |

Keep measured/reported data, provider estimates, synthetic inputs and calculated outputs distinct. Cached means a saved copy; it does not mean synthetic. Synthetic means values deliberately authored for the experiment. Never generate the output savings directly.

Synthetic price construction must be frozen before looking at routing results: use a documented fixed seed, the same declared value range for all regions, and no dependence on carbon intensity or the chosen assignments. Preserve the generated input table with the scenario. The exact generator belongs in the implementation plan. Add a flat-price control fixture: equal energy at identical prices must yield zero electricity-cost difference. Dollar results always carry "Simulated electricity cost" beside them. These prices illustrate decisions; they provide no evidence of real economic savings, even when the calculation is correct.

At data preparation time, download regional files, record provenance, preserve original fields, convert units and align hour-ending timestamps to a common UTC interval. Select one complete 24-hour window using data completeness rather than potential savings. Validate finite values, duplicates, missing hours and consistent intensity definitions. Each field retains source, vintage, unit and estimated/synthetic classification. Do not fill missing carbon with zero.

Require 120 valid carbon-intensity values: five regions for the same 24 UTC intervals. Prefer an explicit UTC field if the inspected workbook supplies one; otherwise document the source reporting zone/offset for each operator. Hour ending T describes [T minus one hour, T). In particular, EIA specifies MISO reports in Eastern Standard Time year-round: July 1, 2026 hour-ending 13:00 EST converts to an interval from 17:00 to 18:00 UTC, not a daylight-saving Eastern conversion. The displayed map time zone must not determine source ingestion. Add that exact conversion as an acceptance fixture. [EIA time-reporting documentation](https://www.eia.gov/electricity/930-content/about.html)

Data gate: within the first two implementation hours, establish a usable common window for five regions. If a region lacks coverage, substitute another documented balancing area and update its label/pin. If real-carbon ingestion fails, ship a wholly labeled synthetic scenario and remove any real-data claim. Do not silently mix synthetic replacement carbon into a historical replay.

Use the scenario title "Historical carbon replay · simulated prices and workloads" when the EIA branch is active, and "Fully synthetic scenario" for the fallback. The planner sees the next 24 hours' historical carbon conditions. It therefore demonstrates decisions with hindsight, not forecast accuracy, actual historical market savings or guaranteed savings tomorrow. This is visible near the title. Live weather and multi-provider live price feeds are outside the required version.

P1 verified the inspected workbook schema and all five mappings for July 2, 2026: 120 complete values. July 1 failed one missing MISO value; chronological completeness selected July 2 without scheduling outcomes. Exact provenance and reproduction are in ../data/README.md. EIA's own data can be redistributed with source acknowledgment and date. [Reuse policy](https://www.eia.gov/about/copyrights_reuse.php)

## 3. Scheduling model

One UTC timeline contains 24 one-hour intervals. Job releases, durations and deadlines are aligned to those boundaries. Every job must finish inside the horizon. Region local times are labels only. Suggested UI limit: 30 jobs, five regions.

Each job contains ID, home region, eligible regions, release time, finish-by deadline, duration, GPU count and estimated facility power in kW. Region capacity means spare GPUs available to this workload, not all capacity of a real data center. Facility power already includes the assumed overhead, so PUE is not applied again.

For each policy run, begin with the same original capacity. Process jobs by release time, then deadline, then ID. For each job, enumerate whole execution windows across eligible regions. A candidate must begin at/after release, finish by deadline and horizon end, have complete signals, and fit GPU capacity during every occupied hour. Reserve the selected interval before placing the next job. Do not revise earlier reservations during that run.

Cost priority minimizes each job's whole-run modeled electricity cost among its currently feasible candidates, then CO₂. Carbon priority minimizes each job's estimated CO₂, then electricity cost. Remaining ties prefer earlier start, then region ID. Use the same candidate construction and units in both modes. These are priorities of a greedy policy, not promises of fleet-wide optimality. There is no opaque combined score or auction framework.

If no candidate fits, return "No placement found under this policy's reservations" and an accurate reason. This is a greedy scheduler and cannot guarantee that every schedulable batch will be placed or that fleet-wide cost/carbon is optimal. Hard constraints apply to every assignment it does return.

For every occupied hour:

```text
energy_kwh = estimated_facility_power_kw × interval_hours
electricity_cost_usd = energy_kwh / 1000 × price_usd_per_mwh
estimated_co2_kg = energy_kwh × carbon_g_per_kwh / 1000
```

Sum whole-job results, including all hours. Preserve signed price values and signed differences; never clamp negative savings into a win. Average-intensity estimates describe attributed workload emissions, not measured marginal grid emissions avoided. Price-based cost covers the assumed electricity expense only.

## 4. Comparison and a falsifiable result

Require three comparison rows, using the same scheduler with different region/time rules:

1. **Earliest at home:** each job's earliest feasible start in its preassigned home region.
2. **Wait at home:** the selected cost/carbon priority, but eligible destinations are restricted to the home region.
3. **Choose region and time:** the selected priority over every eligible region.

Keep jobs, deadlines, initial capacity, ordering, power assumptions and timeline identical across runs. Each row starts with its own independent copy of the original capacity. The home-only rows still obey eligibility and data completeness: if home is excluded by the user, return an unplaced result with that reason. Never schedule an invalid baseline. Home regions are declared before seeing results, not chosen to make the default look bad.

The second row makes the geographic contribution inspectable. Differences between greedy policy runs are not proof of a globally optimal geographic benefit. Label the comparison reference explicitly; the default geographic delta is relative to "Wait at home," not "Earliest at home."

Show submitted, planned-on-time and unplaced counts for each policy. These are full-scenario planned results, not measured execution. Headline deltas are enabled only when all three rows place exactly the same nonempty set of job IDs. For different sets, suppress all aggregate savings amounts and percentages and display "Different work completed; totals are not directly comparable." When no jobs are placed, show "No completed work to compare" and no savings; equal empty sets are not a benefit. A detail table may compare an explicitly identified nonempty common completed set and its deltas. Do not present dropping work as a benefit. A zero or negative reference cost or carbon total has no ordinary savings percentage; display the absolute signed difference instead.

Required demonstrations include: a job placed outside home whose selected objective improves over a feasible home-only alternative; a pinned or urgent job with little/no benefit; a hypothetical carbon-versus-cost tradeoff; and saturation causing rejection. Explain outcomes from actual candidate evaluations, not prewritten success stories. If the selected historical scenario has no geographic benefit, keep that result and use a separate explicitly synthetic teaching scenario to demonstrate the routing mechanism. Never relabel that example as evidence of historical savings.

For a job's explanation, retain the relevant candidate results at its scheduling turn, before its own reservation and subsequent jobs change capacity. Label these as alternatives available at that decision. Cross-policy comparisons use each policy's independent results; they are not the same as that local candidate comparison.

## 5. Dashboard and interaction semantics

| Area | Purpose |
|---|---|
| Header | Product promise; scenario date; "Historical carbon replay · simulated prices and workloads" or "Fully synthetic scenario" |
| Outcome strip | Three compact comparison rows: earliest home, wait home, choose region/time. Full-scenario estimated CO₂, simulated electricity cost, planned-on-time jobs; comparability status |
| Main map | Five region pins with selected-hour intensity, synthetic price and free GPU count; selectable map/table equivalents |
| Job composer | Core: preset job requirements with editable deadline and eligible regions; submit at selected hour. Richer GPU/duration editing is day-two scope |
| Five-row heatmap and timeline | 24 hourly cells per region, shaded by carbon or simulated price; overlaid assignment windows, selected-cell capacity detail, shared UTC cursor and keyboard-operable manual scrubber. Playback is optional polish |
| Job detail | Chosen region/window, full-run cost and CO₂, default placement, feasible alternatives and rejection reasons |

The scrubber only inspects results and never creates jobs or reservations. Adding/editing a job, adjusting capacity or changing policy explicitly rebuilds the scenario from its initial state and job list. An edited run is a new what-if plan, not a claim that already executed jobs moved backward in time. Pause playback on edits and keep the selected time visible.

Multiple jobs may share a region/hour when GPU capacity permits. Keep five heatmap rows: outline the selected job's window, and show every overlapping job plus total/free GPUs in selected-cell detail. Do not draw opaque overlapping bars that hide work. Remaining capacity reflects all regionAndTime assignments. A flat carbon/price field uses a single-value legend rather than a divide-by-zero scale. On narrow screens, preserve readable heatmap cells in a locally scrollable region with fixed labels and equivalent region/hour selectors.

At first load, show a small preloaded batch, select one flexible job, and display its recommendation beside the strongest relevant alternative and rejection reason if applicable. The judge's first action is to shorten its deadline or restrict its eligible regions. The interface immediately recomputes placements, highlights any changed/unplaced jobs and explains the result. A changed assignment is not guaranteed; if the constraint does not bind, show why the result stayed the same. All three policy rows update together.

Clicking a region or job links the map and timeline. Animation follows the computed assignment and respects reduced-motion settings. Use text/icons as well as color for carbon and capacity status. Offer a readable small-screen layout. Explanations use result-derived templates; no LLM dependency.

The pitch should make it clear that an animation visualizes planned dispatch, not physical electricity transfers. Choosing a cleaner destination can raise modeled electricity cost. Show both numbers.

## 6. Architecture and delivery boundary

One frontend application using the familiar Next.js/TypeScript/Tailwind stack from the original spec, exported as a static site for Cloudflare Pages. Bundled scenario JSON flows through validation, a pure scheduling/calculation module, then map/heatmap/detail components. D3 supplies geographic projection and color scales; React renders accessible heatmap cells. No database, authentication, external job execution, production control plane, backend polling or provider abstraction framework is required. Use free hosting within its published limits and an included subdomain; no paid API or domain is required.

The planner is a reusable module inside this repository with one public entry point, independent of React, Next.js, browser globals, network calls and AI. It accepts a validated, versioned JSON-compatible request containing region-hour signals/capacity, jobs, and objective; it returns assignments, unplaced reasons, candidate explanations, provenance references and comparison results. Explicit UTC intervals and unit-bearing fields form the integration contract. Compile this entry point separately and invoke it in plain Node outside Next.js and the test runner, with JSON round-trip and input-immutability checks. This demonstrates the integration boundary without building a second service or publishing an npm package; it is not a claim of universal host compatibility.

The dashboard is the first consumer. Another JavaScript/TypeScript application can call the module; a later thin HTTP wrapper could expose the same contract to other languages. Such a wrapper and actual execution adapters are outside the initial build. Results are proposed placements against a scenario snapshot, not atomic reservations of real GPUs; an execution consumer would need to revalidate current capacity and enforce its own dispatch controls.

Compare only five region-hour sequences and at most 30 jobs. This is small enough for direct window enumeration; measure actual browser responsiveness instead of claiming an untested <5 ms runtime. Live integrations are not a prerequisite for the demo.

Required 24-hour UI: five simple pins and equivalent text selection; the three comparison rows; a five-region by 24-hour heatmap with assignment overlays; manual scrubber; cost/carbon selector; job presets with deadline and eligibility edits; and one selected-job explanation. Carbon and simulated-price modes have labeled units and separate scales; changing the heatmap measure does not change the scheduling objective. Clicking a cell selects the same region/hour on the map. Use a common scale across all regions for each measure and scenario; never normalize each row independently. Missing values are explicitly unavailable, not clean/cheap. Keep keyboard access, non-color status cues and a readable narrow-screen layout in this core. Capacity saturation is demonstrated with a fixed preset rather than a general capacity editor.

24-hour delivery priority: verified data contract and fallback labels; reusable scheduler and accounting checks; that complete core page; performance checks, deployment preparation and rehearsal. Day-two additions are animated routing, autoplay, richer job/capacity editing and visual refinement. Follow Implementation_Plan.md for the detailed sequence.

Protect hours 20–24 as recovery time; target the required build and authorized handoff by hour 20. This is an aggressive active-work estimate, not a guarantee. Check progress at hour 14 and drop optional work if the core flow is incomplete. Human review waiting time is outside this estimate. Do not remove required comparisons or truthful labels to meet the clock.

A consistent historical price dataset is a possible extension only after the core works. The home-only time-shifting comparison is required, not a stretch goal. Do not introduce a partly live dashboard that mixes different dates or five unrelated billing models.

### Latency requirements

Proposed acceptance budgets, not measured claims: on the documented reference laptop/browser, at five regions, 24 hours and 30 jobs, the combined three-policy computation should complete within 50 ms at p95, and a committed edit should paint updated results within 100 ms at p95. Record device, browser, dataset, sample count and observed timings. Scrubbing and region selection reuse calculated results and do not rerun the scheduler. Bundle map geometry, fonts and scenario data so exploration has no network round trip. Report initial page load separately under a declared network profile.

Run the first maximum-size engine benchmark at P2, before building the full UI, and repeat it at release preparation. Plain Node and production-browser timings are separate evidence. Use at least 50 committed edits for the browser interaction measurements, retain slow samples, and measure through the frame displaying the matching updated results.

Start on the main thread. If profiling finds a responsiveness problem, first remove duplicate scheduling and unnecessary renders; use a Web Worker only if the measured compute cost still warrants it. Do not add a worker or caching framework preemptively. Workload deadline compliance is distinct from planner latency: the initial model assumes equal runtime and prepositioned data, and makes no guarantee about cross-region network delay or interactive inference response time.

### Optional AI feature

Keep natural-language job entry in the plan as a stretch feature, disabled by default and outside the core acceptance criteria. Its sole responsibility is converting a request into a draft job form. Show parsed constraints for user review; require an explicit timezone for ambiguous deadlines; validate through the same contract as manual entry. The deterministic planner owns feasibility, assignments and cost/carbon calculations. Explanation templates remain derived from candidate evaluations without an LLM.

The core stays usable if AI is absent, slow, rate-limited or wrong. AI requests are user-triggered, separate from scheduling and scrubbing, cancellable and time-bounded, and never expose a provider secret in the browser. No hosted model or free allowance has been selected or assumed. Any later AI implementation must have its own cost, latency, model-license and deployment check; adding a hosted model endpoint would extend the static-only architecture. A failed optional request preserves the editable form and does not block planning.

## 7. Alternatives and acceptance conditions

- Two regions: useful as an initial validation fixture; not a product scope limit. Five common-format datasets add little scheduler complexity.
- Fully live routing: rejected for the required build because forecasts, data age and dispatch integrations would be additional projects.
- Weather-to-grid modeling: rejected because weather at a coordinate cannot directly supply regional MW, intensity or prices.
- Weighted cost/carbon score: rejected for the first version because its arbitrary weights obscure the tradeoff; two named objectives are explainable.
- Global fleet optimizer: rejected for the initial demo; bounded greedy behavior is labeled and tested. Revisit only if its failures dominate the intended demonstration.

Approve the product design when its scope, modeling assumptions, data fallback and UI behavior are acceptable. Consider implementation done only after whole-window capacity/deadline tests, arithmetic checks, deterministic replay, honest comparison when jobs fail, five-region coverage checks, offline behavior, keyboard access and the deployed demonstration pass.

One arithmetic fixture: 100 kW for two hours at $100/MWh and 400 gCO₂/kWh produces $20 and 80 kg. Add changing-hour signals, exact-deadline completion, unavailable capacity and missing-data cases. Include an adversarial case where a greedy early reservation harms a later job, ensuring the result reports the limitation rather than promising an optimal schedule.

## 8. Approval boundary

The user accepted the product direction on October 27, 2026 and asked to retain optional AI, address latency and make the planner reusable as a layer. This authorizes updating the design and preparing the implementation plan. Application coding remains a separate subsequent step under the previously agreed boundary. No submission or deployment is authorized by this document alone.
