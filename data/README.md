# Scenario provenance and reproduction

The bundled `scenario.json` is **Historical carbon replay · simulated prices and workloads**. It contains five simulated pools, 24 UTC intervals starting **2026-07-02T00:00:00Z**, and three example jobs. All 120 carbon values are present, finite and nonnegative. Nothing has been scheduled yet.

Carbon is EIA's estimated **consumption** intensity, including attributed imports/exports. It is neither measured workload emissions nor marginal emissions avoided. Prices, capacity, jobs and facility power are synthetic. Routing with this snapshot will use hindsight, not a forecast. [EIA methodology](https://www.eia.gov/electricity/930-content/about.html)

## Inspected source mapping

Downloaded October 27, 2026 through Grid Monitor → Download Data → Balancing Authority/Regional Files. Each `<BA>.xlsx` is under `https://www.eia.gov/electricity/gridmonitor/knownissues/xls/`; the raw workbooks remain locally in ignored `data/raw/`. Each region's URL and SHA-256 are retained in `scenario.json`.

Actual worksheet: `Published Hourly Data`. Required columns: `BA`, `UTC time`, `Local date`, `Hour`, `Time zone`, `CO2 Emissions Intensity for Consumed Electricity`. The workbook's `Notes` sheet defines the intensity as **lb CO₂/kWh**. Multiply by **453.59237** for g CO₂/kWh; preserve full numeric precision in JSON. The explicit UTC timestamp marks the end of the interval: subtract one hour for its beginning. The `BA` and reporting-zone columns are checked for every selected row.

| Simulated pool / proxy | Workbook reporting zone | UI display zone | July 2 coverage | Range, g CO₂/kWh |
|---|---|---|---|---|
| California / CISO | Pacific | America/Los_Angeles | 24/24 | 25.09–116.98 |
| Texas / ERCO | Central | America/Chicago | 24/24 | 211.04–393.10 |
| Midwest / MISO | Eastern Standard | America/Chicago | 24/24 | 426.48–501.13 |
| Utah-area / PACE | Mountain | America/Denver | 24/24 | 260.04–729.69 |
| Virginia-area / PJM | Eastern | America/New_York | 24/24 | 379.72–416.59 |

These are balancing-area proxies for fictional compute pools, not state-wide measurements or verified cloud facilities. Display zones do not determine source conversion. Every inspected MISO row is additionally cross-checked using fixed UTC−05:00, even in summer: July 1 HE13 maps to [17:00,18:00) UTC.

## Selection and failure rules

The fixed search interval is July 1–7, 2026, tested in calendar order. Take the first day with exactly 24 unique, finite, nonnegative observations for every region. No scheduling result influences selection. July 1 was rejected because MISO lacked the observation for [03:00,04:00) UTC; July 2 passed. No missing value was filled and no region was replaced. Negative source observations would reject that candidate day rather than be clamped; none occur in the selected snapshot.

Preparation checks column names, explicit UTC hour endings, BA/zone identity, MISO cross-check, duplicates and coverage. Units were manually verified in the inspected workbook Notes; subsequent runs assume the same lb/kWh schema and do not parse the Notes sheet. A missing/corrupt workbook or no complete day fails historical mode; it never silently changes modes. Runtime validation is broader: callers can provide explicit null signals (unavailable windows) and finite signed carbon. A historical label at runtime describes provenance, not proof that every caller-provided slot is complete; the bundled production snapshot has the stricter preparation check.

`write_scenario` validates generated signal arrays and JSON finiteness before writing a temporary sibling file and replacing the destination. Failures leave the prior destination intact. The public TypeScript validator checks the full request, including the fixed generated job/provenance fields, in tests and during the app build. Preparation timestamps vary on re-runs; observations, prices and jobs are deterministic for the same source files. EIA can revise its workbooks: hashes identify the files used here, and a fresh download may produce changed inputs. Keep the bundled snapshot for exact demo reproduction.

## Synthetic inputs

Prices are generated before scheduling, in sorted region-ID order and then slot order. Start unsigned state at 4271; advance with `(1664525 * state + 1013904223) mod 2^32`; price is `40 + state mod 61` USD/MWh. First three CISO prices: 44, 40, 54. The full table is in `scenario.json`. This is an illustrative price experiment, not a tariff or cloud GPU rate. Capacity is 32 spare homogeneous GPUs per region/hour. The three job presets and their total facility power are explicit in the file; power already includes overhead.

Explicit synthetic mode generates carbon with `350 + 30*r + 120*cos((hour - 2*r)*pi/12)`, rounded to three decimals, where r is sorted region index 0–4. It uses July 1, the same independent prices/capacity/jobs, and labels every carbon source synthetic. It is a teaching fixture, not an energy forecast.

## Commands (PowerShell, repository root)

Normal app use requires no download or Python; the small normalized snapshot is bundled.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts/requirements.txt
New-Item -ItemType Directory -Force data/raw | Out-Null
foreach ($ba in @('CISO','ERCO','MISO','PACE','PJM')) {
  curl.exe --fail --location --output "data/raw/$ba.xlsx" "https://www.eia.gov/electricity/gridmonitor/knownissues/xls/$ba.xlsx"
  if ($LASTEXITCODE -ne 0) { throw "Download failed: $ba" }
}
.\.venv\Scripts\python.exe scripts/prepare_data.py --mode historical --input-dir data/raw --output data/scenario.json
npm test
```

Raw workbooks total roughly 500 MB and take several minutes to parse. Initial PowerShell web downloads were truncated by their timeout; resuming with curl completed valid workbooks. Do not use partial files. The historical command reads local files only; it does not fetch or retry. A separate explicit fallback, leaving the historical snapshot intact:

```powershell
.\.venv\Scripts\python.exe scripts/prepare_data.py --mode synthetic --output data/synthetic-scenario.json
.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_prepare_data.py
```

Tested Python 3.14.8; openpyxl 3.1.5 and et-xmlfile 2.0.0 are pinned. No activation is required with these explicit interpreter paths. Attribution: U.S. Energy Information Administration, downloaded October 27, 2026. [EIA reuse policy](https://www.eia.gov/about/copyrights_reuse.php).
