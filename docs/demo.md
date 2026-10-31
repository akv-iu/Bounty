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

## Publish it yourself — October 30 handoff

### Existing Git-connected Worker — October 31 correction

The supplied Cloudflare log shows a successful Next.js export followed by a failed OpenNext migration during `npx wrangler deploy`. This repository now includes `wrangler.jsonc`, naming the existing `bounty` Worker and serving only `out/`. The explicit configuration avoids framework auto-setup; no OpenNext adapter or server bundle is needed. Keep `output: "export"` in `next.config.ts`.

For the existing Cloudflare **bounty** project, use:

| Build setting | Value |
|---|---|
| Root directory | Repository root |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler@4.156.0 deploy` |
| Build variable `NODE_VERSION` | `24.21.0` |
| Build variable `SITE_URL` | The actual HTTPS origin shown in your project's Domains & Routes, with no path |

The asset directory is configured in `wrangler.jsonc`; do not select `.next/` or `output/`. Set `SITE_URL` in the **build** environment, since the HTML metadata is generated during `npm run build`. The Worker name must match `bounty`; update the configuration if you intentionally rename your Cloudflare project.

Commit and push the corrected configuration to `main` when you are ready to publish. A push can trigger the connected Cloudflare deployment automatically. Ensure the next build uses that new commit; retrying the old commit will repeat the failure. If old generated OpenNext settings persist, clear the Cloudflare build cache before rebuilding.

To validate packaging locally without publishing, run `npm run build`, then `npx --yes wrangler@4.156.0 deploy --dry-run`. This does not verify account permissions or the public URL. After your deployment succeeds, complete **Before you post the public link** below.

Sources: [Workers static asset configuration](https://developers.cloudflare.com/workers/static-assets/binding/), [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [Wrangler deployment / automatic framework setup](https://developers.cloudflare.com/workers/wrangler/commands/workers/).

### Alternative: Pages Direct Upload

The user authorized local finishing work and retained hosting/account/public-URL setup. No deployment has been made. Use Cloudflare Pages Direct Upload for this static app; no backend, API keys or custom domain are needed. The previous proposed project name `sunward-akv-bounty` is optional and its availability is unverified.

1. In your Cloudflare account, open **Workers & Pages → Create application → Get started → Drag and drop your files**. Choose a Pages project name. Use the actual assigned `https://…pages.dev` origin in the next step.
2. From `D:\Projects\Bounty`, using Node 24.21.0, build the upload folder in PowerShell:

   ```powershell
   npm ci
   if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed" }
   $env:SITE_URL = 'https://YOUR-PROJECT.pages.dev'
   npm test
   if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
   npm run build
   if ($LASTEXITCODE -ne 0) { throw "Build failed" }
   ```

   Replace the example URL with your actual HTTPS origin, with no subpath, query or fragment. `SITE_URL` sets the canonical and social-image URLs at build time. It is not a secret. You may instead put `SITE_URL=…` in a local `.env.local` file; `.env.example` documents the setting. Without it, local use works and host-specific sharing URLs are omitted. Setting an environment variable in Cloudflare after a Direct Upload does not change already-built HTML.
3. Upload **only `out/`**, with `index.html` at the upload root, then deploy. Do not upload the repository, `.next/`, or the old `output/` prototype. If Cloudflare assigns a different origin, rebuild with that `SITE_URL` and create a new production deployment before sharing.
4. Open the public URL and complete the checks below. Subsequent releases use **Create a new deployment → Production** with a newly built `out/`. A custom domain can wait; if added later, rebuild with that origin.

Cloudflare supports folders or ZIPs for dashboard upload. Direct Upload projects cannot switch to Git integration; that requires a new project. These instructions were checked against [Cloudflare Direct Upload documentation](https://developers.cloudflare.com/pages/get-started/direct-upload/) on October 30, 2026. No CLI installation is needed for the dashboard route.

### Before you post the public link

- Confirm the page title says Sunward, the map and fonts load, and the historical/simulated classification is visible.
- Shorten `batch-eval`'s deadline to 12:00 and check that the recommendation and comparison rows update. Exclude CISO and check the unequal-work warning.
- Set No spare GPUs, confirm no completed work is comparable, then restore Snapshot capacity.
- Add a preset, remove it, remove the final job, then add again. Reset demo must restore the original three jobs and settings. Edits are not saved across reloads.
- At a phone-width window (about 390 px), check the new action buttons, full page and locally scrolling heatmap. Tab to the controls and use the keyboard to edit and reset.
- Open `/social-card.png`, `/icon.svg` and `/notices.txt` on your domain. Inspect page source: canonical, `og:url`, `og:image` and `twitter:image` should use your real public origin. Test the link preview on the platform where you will post; cached previews may take time to refresh.
- Keep the wording accurate: independent planning simulator; historical carbon estimates; simulated prices, capacity and jobs; calculated outcomes, no dispatched compute or measured savings. The default batch has zero additional geographic benefit versus waiting at home.

The social card is committed under `public/`. To regenerate it after intentional artwork changes, run `node scripts/generate_social_card.mjs`, then rebuild. It uses the existing bundled IBM Plex Mono font and Next image renderer, with no new dependency.

### Earlier proposed release — historical P4 record

Destination: Cloudflare Pages project **sunward-akv-bounty**, proposed URL **https://sunward-akv-bounty.pages.dev**. Upload only the verified `out/` directory using Direct Upload, in the user's selected Cloudflare account. The account and name availability are not yet verified; this URL is not live. If unavailable, obtain approval for a replacement name/account before publishing.

The 29-file, 1.25 MB raw export is within the documented free-plan asset limits. No paid domain, API, AI or Functions is required. Direct Upload accepts prebuilt assets; switching that project to Git integration later requires a new project. Sources checked October 27, 2026: [Cloudflare limits](https://developers.cloudflare.com/pages/platform/limits/) and [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Before upload, compare artifact hashes with [p4-export.json](benchmarks/p4-export.json) or rebuild and rerun affected checks if source changed. After upload, P5 must smoke-test the actual public URL, font/map loading, deadline edit, heatmap selection and no-capacity recovery. Competition submission is separately authorized.
