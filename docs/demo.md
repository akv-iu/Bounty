# Sunward demo and release checklist

## Run the actual app

Use Node 24.21.0: `npm ci`, then `npm run build`. Serve `out/` using Python:

```powershell
.\.venv\Scripts\python.exe -m http.server 4173 --bind 127.0.0.1 --directory out
```

Open http://127.0.0.1:4173. Python setup is in [data/README.md](../data/README.md); a system Python 3 also suffices for this static server. `output/preview.html` is the old synthetic prototype, not this app.

## Three-minute walkthrough

1. Start with the classification: historical EIA consumption-carbon estimates for July 2, 2026; simulated prices, capacity and workloads. These are calculated plans with hindsight, not forecasts or dispatched GPU jobs.
2. Select `batch-eval`. At carbon priority its recommendation is CISO, 19:00–23:00 UTC, 0.83 kg and $2.00 simulated electricity expense. Inspect California at 19:00; the white heatmap outline spans four hours and cell detail reports the overlapping job. Switching to price shading inspects the input without rescheduling.
3. Change its deadline to 12:00. The job moves to CISO 00:00–04:00; the batch becomes 10.06 kg/$4.16. Exclude CISO to show a regional alternative and the warning when policies complete different job sets. Do not describe those unequal totals as savings.
4. Choose No spare GPUs. All three rows show zero completed jobs and no aggregate savings. Restore Snapshot capacity, eligibility and the deadline. Explain that the planner is greedy and can miss a feasible batch; it does not prove global optimality.
5. Close on the integration boundary: `planScenario(request)` accepts explicit UTC intervals and units and returns plain JSON. The same entry point runs in the browser or Node without a backend, AI or network request.

## Four reproducible teaching situations

Run `npm run demo:planner`. Its assertions check all four situations; inspect the generated [inputs and results](../examples/p2-worked-examples.json). These are **hand-authored synthetic controls**, separate from the historical dashboard. The script also prints the unmodified historical summary.

| Situation | Expected calculated outcome |
|---|---|
| Geographic benefit | 100 kW × 2 h = 200 kWh. Home at 400 g/kWh: 80 kg; ERCO at 100 g/kWh: 20 kg. Both cost $20 at $100/MWh. Regional choice reduces attributed carbon by 60 kg (75%) against wait-at-home. |
| Pinned urgent workload | Only CISO is eligible; two hours remain. All policies choose the same window: 80 kg/$20, zero additional benefit. |
| Cost/carbon tradeoff | ERCO price becomes $200/MWh. Carbon priority chooses 20 kg/$40; cost priority chooses CISO at 80 kg/$20. Lower carbon costs $20 more. |
| No spare capacity | Every slot has zero GPUs. All jobs are unplaced; no completed work is comparable and savings are null. |

The historical default has **zero additional geographic benefit over waiting at home**. Retain that result. The teaching cases demonstrate decision behavior, not observed savings.

## Reproduce browser timing

After `npm run build` and `npm run build:planner`, run `.\.venv\Scripts\python.exe scripts/serve_probe.py` and visit http://127.0.0.1:4174. This local-only server appends an observer to the unchanged export; none of the probe is packaged in `out/`.

Click Prepare 30 jobs once. It adds 27 copies of `batch-eval` through real UI controls, sets their deadlines to 24 and selects the original job. All five regions and 24 slots remain present. Make at least 50 native edits across priority, deadline and eligibility, allowing each render to finish. The recorded run used 20 priority switches, 20 deadline switches (1/24), and 16 CISO eligibility toggles. Save report writes `docs/benchmarks/p4-browser.json` through the loopback server. Preserve an earlier report before repeating.

Timing starts at the native select change timestamp or checkbox click captured before React's handler, and ends at a timer task after requestAnimationFrame. This is a post-render-opportunity proxy, not physical display timing or INP. The observer independently recalculates outside the measured interval and checks the recommendation, heatmap and every comparison row in the DOM, including below-viewport content. Only trusted events count; overlap, hidden-tab operation or mismatches fail the run. The JSON retains every sample and the browser's navigation, paint and resource entries. Use a fresh origin/cache for cold-load measurements; describe CPU/network conditions and background load. The existing run used unthrottled loopback HTTP, no-store responses and a foreground Brave tab. The initial report is retained separately because EGM review caught and corrected a checkbox timing defect; use p4-browser.json for the final 19.6 ms p95 result.

For offline exploration, stop the serving process after assets load. Change priority, inspect another region/hour, switch heatmap measure, then reject/restore capacity. The already loaded app must continue working. An offline page reload is not supported; there is no service worker or persistent edit storage.

## Proposed release — H4 approval required

Destination: Cloudflare Pages project **sunward-akv-bounty**, proposed URL **https://sunward-akv-bounty.pages.dev**. Upload only the verified `out/` directory using Direct Upload, in the user's selected Cloudflare account. The account and name availability are not yet verified; this URL is not live. If unavailable, obtain approval for a replacement name/account before publishing.

The 29-file, 1.25 MB raw export is within the documented free-plan asset limits. No paid domain, API, AI or Functions is required. Direct Upload accepts prebuilt assets; switching that project to Git integration later requires a new project. Sources checked October 27, 2026: [Cloudflare limits](https://developers.cloudflare.com/pages/platform/limits/) and [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Before upload, compare artifact hashes with [p4-export.json](benchmarks/p4-export.json) or rebuild and rerun affected checks if source changed. After upload, P5 must smoke-test the actual public URL, font/map loading, deadline edit, heatmap selection and no-capacity recovery. Competition submission is separately authorized.
