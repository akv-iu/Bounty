# Goldfish review: five-region design

**Current target:** `Initial/Design_Proposal.md`, full file.  
**Date:** October 26, 2026.  
**Status:** One EGM review round complete; all three reviewers returned findings. Primary-agent revisions are incorporated into the proposed design and await user approval. Raw five-region ingestion remains unverified.  
**Scope:** One critical EGM review round of the five-region Option 2 design, followed by primary-agent synthesis. The reviewed input contained 110 lines; references below identify that revision and its section headings. This is not a claim that the revised design received a second clean review.

The user requested critique and a proposed final direction before approving detailed implementation planning. Three fresh-context reviewers were dispatched under EGM: design correctness, product/simplicity, and data feasibility. No application code is part of this review.

## Prioritized findings and disposition

### 1. Major — The baseline does not isolate geographic value

- **Reviewers:** Design critic and skeptical architect.
- **Affected scope:** Reviewed lines 63–67 and 94; Comparison and delivery boundary.
- **Discrepancy:** Earliest execution at home is compared with a policy allowed to change both region and time. All benefits could come from waiting at home. The required successful example allowed a purely temporal improvement.
- **Rationale:** A five-region Option 2 demonstration must let a judge inspect whether geographic choice contributes anything beyond temporal flexibility.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Require three policy rows: earliest at home, wait at home using the selected priority, and choose region/time using that same priority. Reuse the scheduler with restricted destinations. Require an explicit out-of-home example or honestly show no geographic benefit; separate synthetic teaching examples from historical evidence.
- **Resolver judgment:** The design reviewer suggested a per-job alternative could suffice; the architect suggested a third full comparison. Choose the shared-scheduler comparison because it exposes whole-batch capacity and completion differences while adding no new scheduling algorithm. Do not claim global optimality from the result.

### 2. Major — A baseline can violate the user's location restriction

- **Reviewer:** Design critic.
- **Affected scope:** Reviewed lines 43, 45, 63 and 76; Scheduling and comparison.
- **Discrepancy:** A job can have California as home while the user restricts eligible regions to Texas. The draft's baseline still says to run at home.
- **Rationale:** A valid proposed placement must not be compared against an invalid baseline assignment.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Home-only policies obey the same eligibility, data, capacity and deadline checks. If home is ineligible, mark the baseline job unplaced with that reason and suppress aggregate savings when completed sets differ.

### 3. Major — Synthetic prices can manufacture the economic narrative

- **Reviewer:** Skeptical architect.
- **Affected scope:** Reviewed lines 25, 29, 47, 67 and 74; Data, priority and scoreboard.
- **Discrepancy:** Correct arithmetic and a synthetic-data label do not prevent the author from choosing prices that create a desired cost/carbon story.
- **Rationale:** Historical carbon data can lend undeserved credibility to synthetic dollar savings when they appear together.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Freeze and disclose a seeded price-construction rule before inspecting routing results; do not derive it from chosen assignments or carbon values. Preserve inputs and add a flat-price control fixture. Display "Simulated electricity cost" beside dollar results. Treat economic outcomes as illustrative, not evidence of actual bill savings.

### 4. Major — The first judge interaction is not specified

- **Reviewer:** Skeptical architect.
- **Affected scope:** Reviewed lines 10, 67 and 71–84; Product and dashboard.
- **Discrepancy:** Six dashboard areas and a list of possible demos do not ensure a judge discovers the constraint-aware scheduling behavior.
- **Rationale:** The clearest proof is that changing a real constraint changes or validates the computed decision, with an inspectable alternative.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Load a small batch with a selected flexible job. Put its recommendation and strongest relevant alternative together. Make deadline/eligibility edits the first interaction; recompute all comparisons and explain a changed or unchanged result. Do not script a westward movement or a guaranteed win.

### 5. Major — The first-day UI has no firm scope boundary

- **Reviewer:** Skeptical architect.
- **Affected scope:** Reviewed lines 75–82, 92 and 104; Dashboard and delivery.
- **Discrepancy:** Map coordination, detailed editing, playback, alternatives, responsive behavior and accessibility are grouped as one "complete page" in a repository containing only documentation.
- **Rationale:** Five regions are a small computational workload; interaction breadth is the larger delivery risk.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Require five pins, three comparisons, a simple timeline/manual scrubber, two priorities, preset jobs with deadline/eligibility edits and one decision explanation. Keep accessibility in the core. Move autoplay, animated routing and general capacity editing to the second day; use a fixed saturation preset initially.

### 6. Major — The historical-data acquisition contract needs an explicit gate

- **Reviewer:** Data-focused design critic.
- **Affected scope:** Reviewed lines 20, 31, 33 and 37; Data.
- **Discrepancy:** Source documentation establishes availability, not that the proposed ingestion path returns a complete five-region dataset. EIA's six-month balance CSV description does not establish a carbon-field route.
- **Rationale:** A labeled synthetic branch is viable, but the historical-carbon claim needs inspected source files.
- **Disposition:** PROPOSE FIX — incorporated as a verification gate; verification itself is pending.
- **Proposed change:** Specify Grid Monitor → Download Data → Balancing Authority/Regional Files → .xlsx → Published Hourly Data. Require the actual consumption-intensity column, published unit, timestamp interpretation and 120 valid same-window values to be recorded before enabling the historical-carbon label.

### 7. Major — Map time zones can misalign source records

- **Reviewer:** Data-focused design critic.
- **Affected scope:** Reviewed lines 31, 41 and 106; Data, clock and acceptance checks.
- **Discrepancy:** EIA uses hour-ending values and specifies MISO reports Eastern Standard Time year-round. A normal daylight-saving conversion based on the map location shifts some records.
- **Rationale:** A one-hour error can change the preferred location and fabricate an apparent temporal/geographic advantage.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Separate source reporting clocks from display clocks. Convert hour ending T into [T−1h, T); use explicit source UTC if available. Require a fixture where MISO July 1, 2026 13:00 EST ends at 18:00 UTC and starts at 17:00 UTC.

### 8. Major — "Historical replay" can overstate mixed-input results

- **Reviewer:** Data-focused design critic.
- **Affected scope:** Reviewed lines 25, 35, 67 and 73; Data and presentation.
- **Discrepancy:** Only carbon is historical; prices, workloads, power and capacity are synthetic/assumed. A generic historical-replay heading can imply observed market outcomes.
- **Rationale:** Correct calculations with mixed inputs do not reconstruct actual historical dispatch or financial savings.
- **Disposition:** PROPOSE FIX — incorporated into the proposal for approval.
- **Proposed change:** Use the exact title "Historical carbon replay · simulated prices and workloads" and keep "Simulated electricity cost" beside dollars. Call the fallback "Fully synthetic scenario." Historical look-ahead remains explicitly disclosed.

## Data verification boundary

The data reviewer read the full proposal and source spec, reviewer persona and standard. Official EIA documentation confirms consumption/production estimates, the regional workbook route, hour-ending semantics and MISO's clock exception. It also names CISO, ERCO, PJM and MISO. Primary-agent official-source search independently found EIA using the PacifiCorp East/PACE label, but this does not validate a source workbook or simulated site's exact mapping.

No regional workbook was retrieved and inspected. The web tool could not parse the reference workbook; a direct read-only request failed in the sandbox, and its escalated retry was interrupted when the research time box ended. Actual headers, units, timestamp fields, the raw PACE series and a common complete five-region day remain unverified. This is a real remaining data gate, not a clean integration result. [EIA documentation](https://www.eia.gov/electricity/930-content/about.html)

## Additional primary-agent corrections

The synthesis also changes "Cheapest/Cleanest" claims to cost/carbon priorities over each job's currently feasible candidates; labels headline numbers as full-scenario planned outcomes rather than execution telemetry; retains alternatives at the time of each scheduling decision so later reservations cannot rewrite the explanation; and suppresses misleading percentages for zero/negative cost baselines. These are small correctness clarifications, not extra product features.

## Approval boundary

The proposed design incorporates the above recommendations for review. The user's original `Initial/Project_Spec.md` is preserved. After the user approves the proposed direction, the next deliverable is the detailed implementation plan. Application coding has not begun.

---

# Archived initial review — two-region recommendation superseded

The material below records the earlier critique. Its two-region scope and optional home-only comparison are superseded by `Initial/Design_Proposal.md` and the review above.

**Target:** `Initial/Project_Spec.md`, all 94 lines.  
**Review date:** October 26, 2026.  
**User decisions:** Option 2, multi-region compute routing; solo, 24–48 hours.  
**Status:** Recommendations for discussion; the original spec has not been rewritten.

The idea fits the brief. The document is a useful creative brief, but its routing rules and impact claims are not yet precise enough to build against. The strongest submission would make a small number of defensible scheduling decisions and let judges inspect them.

This review combines independent EGM design and implementation-readiness reviews with a separate check of official data documentation. Overlapping findings are consolidated below; Blocker means a decision is needed before implementation, not that the idea is infeasible. Cosmetic issues and production infrastructure requirements were excluded.

## Keep these decisions

- A deterministic scheduler, with no LLM deciding arithmetic or resource allocation.
- A baseline comparison and a replay that makes cause and effect visible.
- Workload injection so judges can exercise the system.
- A complete bundled scenario that works without network access.
- Immediate access, with no login or database setup.

## Prioritized findings and proposed edits

### 1. Blocker: the scheduler does not yet define a valid placement

**Reviewers:** Implementation readiness; design critic (also reported as Major).  
**Scope:** `Initial/Project_Spec.md:91–94`.  
**Disposition:** PROPOSE FIX.

The urgency formula does not ensure a job finishes before its deadline, fits available GPUs, or has capacity throughout its run. Two jobs can choose the same supposedly available slot. One cheap hour is insufficient for a three-hour job. “Lowest cost, highest clean percentage” also leaves the tradeoff unresolved.

**Proposed edit:** Replace the urgency-led policy with enumeration of feasible whole-job `(region, start time)` windows. Route new, non-preemptible jobs once; reserve their capacity; report a visible failure when no placement is found. Use two explicit objectives, **Cheapest** and **Cleanest**, and display both cost and emissions for either choice. Do not imply that both always improve. The proposed contract below supplies the remaining rules.

### 2. Blocker: the scoreboard promises results the model cannot establish

**Reviewers:** Implementation readiness; design critic (also reported as Major).  
**Scope:** `Initial/Project_Spec.md:71–72, 86–94`.  
**Disposition:** PROPOSE FIX.

There is no specified baseline, energy accounting, or completion rule. Deferring work beyond the visible day could look like a saving. Net load does not measure transmission congestion: CAISO defines congestion in terms of constrained delivery through the transmission network. [CAISO explanation](https://www.caiso.com/content/monthly-market-performance/jan-2026/congestion.html)

**Proposed edit:** Replace the scoreboard with **modeled electricity-cost difference**, **estimated workload CO₂ difference**, and **jobs completed by deadline**. Define the baseline as earliest feasible execution in each job's fixed home region, using the same jobs, capacity, horizon and deadlines. Compare full runs of matched jobs; if completion differs, flag that difference and do not advertise aggregate savings from omitted work. Show negative savings when a policy costs more.

Wholesale energy expense is only one component of running compute. Do not call it a reduction in a cloud GPU invoice. Average-intensity accounting estimates attributed emissions; it does not demonstrate physical marginal emissions avoided. [PJM distinguishes average and marginal emissions](https://www.pjm.com/markets-and-operations/m/emissions).

### 3. Major: weather is being asked to supply missing grid information

**Reviewers:** Design critic; implementation readiness.  
**Scope:** `Initial/Project_Spec.md:67, 84–90`.  
**Disposition:** PROPOSE FIX.

The solar and wind conversion functions have no capacities or calibration. A coordinate's irradiance and wind speed do not determine an entire region's renewable generation. Clean generation divided by demand is also not necessarily the clean share of electricity consumed, because interchange and storage matter. Fixed midday/evening price and carbon ranges should be scenario assumptions, not universal rules.

**Proposed edit:** Make hourly price, carbon intensity and compute capacity explicit inputs with units and provenance. Remove weather-to-grid inference from the first build. Open-Meteo documents weather quantities such as irradiance, not regional power output. [Open-Meteo variables](https://open-meteo.com/en/docs)

Use one coherent historical replay with carbon estimates from EIA if a complete overlapping day can be extracted quickly. Simulate prices, jobs and capacity openly. If extraction fails the initial time box, use a fully simulated scenario rather than inventing measured data.

### 4. Major: the time model and replay semantics are ambiguous

**Reviewers:** Design critic; implementation readiness.  
**Scope:** `Initial/Project_Spec.md:67, 73–78, 86–94`.  
**Disposition:** PROPOSE FIX.

California at local noon and Texas at local noon are different instants. Mixing current weather with an old regional profile introduces a similar error. Playback can also accidentally create duplicate jobs or reservations if the clock drives scheduling side effects.

**Proposed edit:** Use one fixed 24-hour UTC interval for both regions, with local times as labels. Require every demo job to finish within that interval. Scrubbing inspects the computed schedule; it never schedules work again. Editing a scenario explicitly recomputes it. Label historical replay as using known historical conditions, so it is not mistaken for a live forecast evaluation. Switch complete snapshots rather than silently mixing sources.

### 5. Major: the spec budgets for presentation before proving the decision

**Reviewers:** Implementation readiness; design critic.  
**Scope:** `Initial/Project_Spec.md:56, 65–78`.  
**Disposition:** PROPOSE FIX.

Four regions, several data providers, auction agents, live conditions, animation and savings metrics create several integration tasks. The proposed 80% visual emphasis, 15–20-line formula limit and unmeasured <5 ms target are not useful correctness criteria.

**Proposed edit:** Record the user's Option 2 choice and solo time budget. Start with two simulated compute pools located in the CAISO and ERCOT footprints. Retain the proposed frontend stack if familiar. Build the scheduler and comparison first, then a polished single-page explanation. Remove the arbitrary line limit and benchmark before making latency claims. Add regions only after the full decision path works.

## Proposed product promise

> Given a flexible AI batch job and its deadline, choose an available region and start time, then explain its modeled cost and carbon tradeoff against the default placement.

Target an operator with pre-existing compute capacity in two regions. Use batch evaluation or batch inference as the demo workload. Assume equivalent hardware, equal runtime and input data already available in eligible regions. Route before execution; do not migrate running training jobs. These assumptions avoid pretending that data transfer and hardware differences are free in general.

The name can reference “Compute Follows the Sun,” but the policy should follow the input signals: a windy nighttime region may win. Do not script a westward animation independently of the scheduler.

Carbon-aware geographic placement already exists in industry. Google described moving flexible work across data centers in 2021. The opportunity here is a clear, inspectable demonstration of the decision and its constraints. [Google's implementation](https://blog.google/company-news/outreach-and-initiatives/sustainability/carbon-aware-computing-location/)

## Minimal model and decision contract

| Object | Required information |
|---|---|
| Scenario | Start timestamp, 24 one-hour intervals, source dates and units, per-field observed/estimated/simulated labels |
| Region | ID, display time zone, homogeneous available GPU count for every interval |
| Hourly signal | Region, interval start in UTC, electricity price in USD/MWh, intensity in gCO₂/kWh |
| Job | ID, release timestamp, deadline timestamp, integer duration in hours, GPU count, estimated facility power in kW, home region, eligible regions |
| Result | Assigned region and start/end, modeled energy/cost/CO₂, decision explanation; or an explicit unplaced reason |

Treat power as the job's estimated facility allocation, including its assumed cooling overhead; do not multiply by PUE a second time. Keep hardware and power assumptions identical across regions for the MVP. Validate finite numeric inputs, positive duration/power/GPU requirements, timestamps, region membership and complete hourly signals. Missing intensity is unknown, never zero. Negative electricity prices can be valid.

For each scenario run:

1. Process jobs in release-time order; break simultaneous arrivals by earliest deadline, then job ID. Later arrivals cannot rewrite earlier reservations.
2. Enumerate start times at or after release in every eligible region. Execution occupies `[start, end)` and must end at or before the deadline and scenario end.
3. Require enough GPUs in **every** occupied interval and complete price/carbon inputs. Reserve capacity after choosing a placement.
4. Sum cost and emissions over the entire run. **Cheapest** minimizes cost, then emissions. **Cleanest** minimizes emissions, then cost. Break remaining ties by earlier start, then region ID.
5. If no candidate remains, show “No feasible placement found under current reservations” with the constraint. Do not claim the greedy algorithm proves no possible global schedule exists.

This is a deterministic greedy scheduler, not a globally optimal fleet planner. Document that limitation. At two regions and 24 slots, direct enumeration is sufficient; an auction protocol or optimization service is unnecessary.

For each occupied hour:

```text
energy_kwh = facility_power_kw × interval_hours
energy_cost_usd = energy_kwh / 1000 × price_usd_per_mwh
estimated_co2_kg = energy_kwh × carbon_g_per_kwh / 1000
```

The baseline uses the same capacity checks and ordering but selects the earliest feasible start in the fixed home region. Compute both policies independently from identical initial capacity. Count all submitted, completed and unplaced jobs. Only compare cost/carbon on an explicitly identified common completed set; surface any completion mismatch prominently.

## Data plan and verification boundary

EIA documents estimated hourly production and consumption carbon intensity; emissions are delayed, so use them for replay. Start from [Grid Monitor](https://www.eia.gov/electricity/gridmonitor/dashboard/electric_overview/US48/US48), Download Data, Balancing Authority/Regional Files, and inspect CISO and ERCO. Select the same complete UTC interval and preserve hour-ending semantics when normalizing. [EIA data documentation](https://www.eia.gov/electricity/930-content/about.html)

Bundle the extracted subset with its source, publication/download dates and transformation notes. EIA permits redistribution of its data with acknowledgment. [EIA reuse policy](https://www.eia.gov/about/copyrights_reuse.php)

| Input | First-build source | Visible label |
|---|---|---|
| Hourly carbon intensity | Pinned EIA consumption estimates; synthetic if unavailable | “EIA estimated CO₂ intensity, historical date” or “Simulated carbon intensity” |
| Hourly electricity prices | Hand-authored, deterministic scenario | “Simulated electricity prices” |
| Jobs, GPU capacity, workload power | Small deterministic fixture | “Simulated compute workload and capacity” |

Official documentation and access policies were checked; raw files have not been downloaded or validated. Completeness of the selected day is the first implementation checkpoint. Do not mix production intensity in one region with consumption intensity in the other without an explicit methodological change.

CAISO and ERCOT publish market prices, but aligning pricing locations, intervals and formats is extra work. Add those only if the core is finished. [CAISO prices](https://www.caiso.com/todays-outlook/prices), [ERCOT prices](https://www.ercot.com/mktinfo/prices)

Do not assume Electricity Maps is an unrestricted free two-region feed: its official help states that general CSV datasets were sunset and academic access has conditions. [Dataset access](https://help.electricitymaps.com/en/articles/13169264-datasets-and-csv-downloads), [academic access](https://help.electricitymaps.com/en/articles/13168512-academic-data-access-and-availability)

Historical future values visible to the scheduler create a hindsight simulation. Results demonstrate behavior under those inputs, not forecast accuracy or guaranteed future savings. Keep that label beside the scenario, not only in the README.

## What judges should experience

One page: a two-region diagram, a 24-hour placement timeline, a small job list and the three outcome metrics. Each assignment can reveal its decision: chosen window, alternative, cost/carbon difference and limiting constraint. The existing scrubber and workload-injection ideas support this directly.

Demonstrate a flexible job that waits or changes region. Then shorten its deadline so the attractive window becomes infeasible. Finally, fill the cleaner region's capacity and show the fallback or rejection. Let the judge switch Cheapest/Cleanest and see a real tradeoff, including a worse dollar result when appropriate.

This tests creativity through interaction, clarity through explanations, and execution through observable constraints—the three criteria in the supplied poster. No additional chat assistant is needed.

## Build sequence and stop line

| Elapsed time | Deliverable | Exit check |
|---|---|---|
| 0–2 hours | Finalize contracts and obtain one coherent scenario | Cap data-access exploration at about an hour; label simulation if it fails. Hand-calculate one placement. |
| 2–7 hours | Scheduler, baseline and metric functions | Correct full-window capacity, deadline boundaries, units and failures. |
| 7–13 hours | Single-page working flow | Inject a job → see placement → inspect comparison and reason. |
| 13–18 hours | Timeline, region diagram and replay | UTC alignment; scrubbing changes no reservations; input edits recompute predictably. |
| 18–24 hours | Deploy and rehearse | Test the deployed page, offline scenario, keyboard controls and narrow layout; stop adding features. |

With a second day, first improve failure cases and explanations. Then add one valuable extension: either compatible historical market prices, or a same-region time-shifting comparison that isolates the benefit of geographic routing. Additional regions and routing animation come last. Live weather alone does not improve the validity of the routing inputs.

Meaningful checks to include:

- A 100 kW, two-hour job at $100/MWh and 400 gCO₂/kWh costs $20 and is attributed 80 kg CO₂. Check varying hourly values too.
- A multi-hour job cannot cross an occupied interval, overbook GPUs, start before release or finish after deadline. Finishing exactly at deadline is valid.
- A cheaper region with insufficient GPUs is excluded. An impossible job stays visibly unplaced.
- Identical inputs produce identical placements; scrub forward/backward without changing results.
- Different local-time labels identify the same UTC instant. No job disappears past the replay horizon.
- A policy that does less work cannot report full-fleet savings. A more expensive cleaner route displays the increased cost.
- Missing signals are excluded, and the bundled scenario works without network access.

## Small factual cleanup before turning this into a build spec

The company paragraph should be shorter and sourced. Torus currently presents Station, Spin, Pulse and Overwatch on its website; verify the draft's Nova/Lattice terminology instead of treating it as a required integration. “Torus-aware” should not imply an API connection that does not exist. [Current Torus product overview](https://www.torus.co/)

The supplied poster is sufficient for this review's judging criteria. It shows $5K, while the image's lower caption mentions $10K; confirm the actual event rules before submission rather than spending build time on the discrepancy.

No application code, runtime data ingestion or deployed behavior was tested. The main remaining risk is presenting modeled or historical results as measured live-world savings.
