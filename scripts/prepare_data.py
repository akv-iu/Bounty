"""Prepare a fixed UTC day; never silently fall back to synthetic data."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import sys
import tempfile
from zipfile import BadZipFile

UTC = timezone.utc
START = datetime(2026, 7, 1, tzinfo=UTC)
CARBON_COLUMN = "CO2 Emissions Intensity for Consumed Electricity"
BASE_URL = "https://www.eia.gov/electricity/gridmonitor/knownissues/xls/"
REGIONS = {
    "CISO": ("California pool", "America/Los_Angeles", "Pacific"),
    "ERCO": ("Texas pool", "America/Chicago", "Central"),
    "MISO": ("Midwest pool", "America/Chicago", "Eastern Standard"),
    "PACE": ("Utah-area pool", "America/Denver", "Mountain"),
    "PJM": ("Virginia-area pool", "America/New_York", "Eastern"),
}


def hour_start_utc(day, hour_ending, offset_hours):
    """Fixed-offset reporting conversion, used to cross-check MISO's UTC column."""
    if not isinstance(hour_ending, int) or not 1 <= hour_ending <= 24:
        raise ValueError("Hour ending must be 1..24")
    local = datetime.fromisoformat(day).replace(tzinfo=timezone(timedelta(hours=offset_hours)))
    return (local + timedelta(hours=hour_ending - 1)).astimezone(UTC)


def complete_day(series, start):
    if set(series) != set(REGIONS):
        raise ValueError("Expected CISO, ERCO, MISO, PACE and PJM")
    expected = [start + timedelta(hours=i) for i in range(24)]
    result = {}
    for region, rows in series.items():
        slots = {}
        for timestamp, value in rows:
            if timestamp not in expected:
                raise ValueError(f"{region}: timestamp outside the selected hourly slots: {timestamp}")
            if timestamp in slots:
                raise ValueError(f"{region}: duplicate slot {timestamp}")
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
                raise ValueError(f"{region}: missing, negative or nonfinite carbon at {timestamp}")
            slots[timestamp] = value
        if set(slots) != set(expected):
            raise ValueError(f"{region}: expected 24 complete carbon slots, found {len(slots)}")
        result[region] = [slots[slot] for slot in expected]
    return result


def select_day(series):
    # Selection uses completeness only, before any scheduling outcomes exist.
    for offset in range(7):
        start = START + timedelta(days=offset)
        window = {region: [(t, v) for t, v in rows if start <= t < start + timedelta(days=1)] for region, rows in series.items()}
        try:
            return start, complete_day(window, start)
        except ValueError as error:
            print(f"Rejected {start.date()}: {error}", file=sys.stderr)
    raise ValueError("No complete day in July 1-7, 2026; choose synthetic mode explicitly")


def read_workbook(path, region):
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        rows = workbook["Published Hourly Data"].iter_rows(values_only=True)
        header = next(rows)
        names = ["BA", "UTC time", "Local date", "Hour", "Time zone", CARBON_COLUMN]
        if any(header.count(name) != 1 for name in names):
            raise ValueError(f"{region}: unexpected EIA columns")
        indices = {name: header.index(name) for name in names}
        selected = []
        for row in rows:
            ending = row[indices["UTC time"]]
            if not isinstance(ending, datetime):
                raise ValueError(f"{region}: malformed UTC time")
            beginning = ending.replace(tzinfo=UTC) - timedelta(hours=1)
            if not START <= beginning < START + timedelta(days=7):
                continue
            if row[indices["BA"]] != region or row[indices["Time zone"]] != REGIONS[region][2]:
                raise ValueError(f"{region}: wrong BA or reporting zone")
            if region == "MISO":
                local_day = row[indices["Local date"]].date().isoformat()
                if hour_start_utc(local_day, row[indices["Hour"]], -5) != beginning:
                    raise ValueError("MISO: fixed-EST cross-check disagrees with published UTC")
            value = row[indices[CARBON_COLUMN]]
            # Workbook Notes define this column in lb CO2/kWh, not g/kWh.
            grams = value * 453.59237 if isinstance(value, (int, float)) and not isinstance(value, bool) else None
            selected.append((beginning, grams))
        return selected
    finally:
        workbook.close()


def prepare(mode, input_dir=None):
    if mode not in ("historical", "synthetic"):
        raise ValueError("Select historical or synthetic explicitly")
    if mode == "historical" and input_dir is None:
        raise ValueError("Historical mode requires --input-dir")
    sources = {}
    start = START
    if mode == "historical":
        series = {}
        for region in REGIONS:
            path = Path(input_dir) / f"{region}.xlsx"
            print(f"Reading {path}", file=sys.stderr, flush=True)
            series[region] = read_workbook(path, region)
            with path.open("rb") as stream:
                digest = hashlib.file_digest(stream, "sha256").hexdigest()
            sources[region] = {"kind": "historical-estimate", "label": "EIA estimated consumption CO2 intensity", "url": BASE_URL + path.name, "sha256": digest}
        start, carbon = select_day(series)
    else:
        # shortcut: illustrative daily waves; use validated sources for historical claims.
        carbon = {region: [round(350 + i * 30 + 120 * math.cos((hour - i * 2) * math.pi / 12), 3) for hour in range(24)] for i, region in enumerate(REGIONS)}
        sources = {region: {"kind": "synthetic", "label": "Illustrative daily wave; not a forecast", "url": None, "sha256": None} for region in REGIONS}
    state = 4271
    regions = []
    for region in sorted(REGIONS):
        prices = []
        for _ in range(24):
            state = (1664525 * state + 1013904223) % (2 ** 32)
            prices.append(40 + state % 61)
        name, zone, _ = REGIONS[region]
        regions.append({"id": region, "name": name, "timeZone": zone, "carbonGPerKwh": carbon[region], "priceUsdPerMwh": prices, "availableGpus": [32] * 24, "carbonSource": sources[region]})
    jobs = [
        {"id": "batch-eval", "homeRegionId": "CISO", "eligibleRegionIds": sorted(REGIONS), "releaseSlot": 0, "deadlineSlot": 24, "durationSlots": 4, "gpus": 16, "facilityPowerKw": 8},
        {"id": "urgent-eval", "homeRegionId": "PJM", "eligibleRegionIds": ["PJM"], "releaseSlot": 2, "deadlineSlot": 4, "durationSlots": 2, "gpus": 8, "facilityPowerKw": 4},
        {"id": "overnight-eval", "homeRegionId": "ERCO", "eligibleRegionIds": ["ERCO", "MISO", "PACE"], "releaseSlot": 6, "deadlineSlot": 20, "durationSlots": 3, "gpus": 16, "facilityPowerKw": 8},
    ]
    return {"schemaVersion": 1, "scenarioId": f"{mode}-{start.date()}-v1", "startUtc": start.isoformat().replace("+00:00", "Z"), "intervalHours": 1, "objective": "carbon", "provenance": {"mode": mode, "preparedAt": datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"), "prices": "synthetic", "capacity": "synthetic", "jobs": "synthetic", "priceSeed": 4271}, "regions": regions, "jobs": jobs}


def write_scenario(scenario, output):
    regions = scenario["regions"]
    if len(regions) != 5 or len({r["id"] for r in regions}) != 5:
        raise ValueError("Expected five unique regions")
    start = datetime.fromisoformat(scenario["startUtc"])
    complete_day({r["id"]: [(start + timedelta(hours=i), value) for i, value in enumerate(r["carbonGPerKwh"])] for r in regions}, start)
    for region in regions:
        for key in ("priceUsdPerMwh", "availableGpus"):
            values = region[key]
            if len(values) != 24 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in values):
                raise ValueError(f"{region['id']}: invalid {key}")
        if any(not isinstance(v, int) or v < 0 for v in region["availableGpus"]):
            raise ValueError("GPU capacities must be nonnegative integers")
    payload = json.dumps(scenario, indent=2, allow_nan=False) + "\n"
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent, prefix=".scenario-", suffix=".tmp", delete=False) as stream:
            temp = Path(stream.name)
            stream.write(payload)
        os.replace(temp, output)
    finally:
        if temp is not None and temp.exists():
            temp.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", required=True, choices=["historical", "synthetic"])
    parser.add_argument("--input-dir", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        write_scenario(prepare(args.mode, args.input_dir), args.output)
    except (ValueError, OSError, KeyError, BadZipFile) as error:
        parser.exit(1, f"Preparation failed; output unchanged: {error}\n")
    print(f"Wrote {args.output}: {args.mode}, 5 regions x 24 hours")


if __name__ == "__main__":
    main()
