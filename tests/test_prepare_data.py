from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import tempfile
import unittest
import subprocess
import sys
from openpyxl import Workbook

from scripts.prepare_data import CARBON_COLUMN, complete_day, hour_start_utc, prepare, read_workbook, select_day, write_scenario

UTC = timezone.utc
START = datetime(2026, 7, 1, tzinfo=UTC)
IDS = ["CISO", "ERCO", "MISO", "PACE", "PJM"]

def series():
    return {region: [(START + timedelta(hours=i), 400.0) for i in range(24)] for region in IDS}

class PreparationTests(unittest.TestCase):
    def test_selects_first_complete_day_without_filling_missing_carbon(self):
        rows = series()
        rows["MISO"][3] = (START + timedelta(hours=3), None)
        for region in IDS:
            rows[region] += [(START + timedelta(hours=24+i), 500.0) for i in range(24)]
            rows[region] += [(START + timedelta(hours=48+i), 100.0) for i in range(24)]
        chosen, carbon = select_day(rows)
        self.assertEqual(chosen, START + timedelta(days=1))
        self.assertEqual(carbon["MISO"], [500.0] * 24)
        with self.assertRaisesRegex(ValueError, "No complete day"): select_day({region: [] for region in IDS})

    def test_workbook_columns_units_and_hour_ending(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "MISO.xlsx"
            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "Published Hourly Data"
            sheet.append(["BA", "UTC time", "Local date", "Hour", "Time zone", CARBON_COLUMN])
            sheet.append(["MISO", datetime(2026, 7, 1, 18), datetime(2026, 7, 1), 13, "Eastern Standard", 1])
            workbook.save(path)
            self.assertEqual(read_workbook(path, "MISO"), [(datetime(2026, 7, 1, 17, tzinfo=UTC), 453.59237)])
            sheet.cell(2, 4, 12)
            workbook.save(path)
            with self.assertRaisesRegex(ValueError, "fixed-EST"): read_workbook(path, "MISO")

    def test_failed_historical_cli_preserves_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "scenario.json"
            output.write_text("previous-valid-output", encoding="utf-8")
            result = subprocess.run([sys.executable, "scripts/prepare_data.py", "--mode", "historical", "--input-dir", directory, "--output", str(output)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("output unchanged", result.stderr)
            self.assertEqual(output.read_text(encoding="utf-8"), "previous-valid-output")

    def test_corrupt_workbook_reports_failure_without_replacing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "scenario.json"
            output.write_text("previous-valid-output", encoding="utf-8")
            (Path(directory) / "CISO.xlsx").write_bytes(b"PK-truncated-download")
            result = subprocess.run([sys.executable, "scripts/prepare_data.py", "--mode", "historical", "--input-dir", directory, "--output", str(output)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn("output unchanged", result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertEqual(output.read_text(encoding="utf-8"), "previous-valid-output")

    def test_miso_fixed_est_hour_ending(self):
        self.assertEqual(hour_start_utc("2026-07-01", 13, -5), datetime(2026, 7, 1, 17, tzinfo=UTC))

    def test_five_complete_sequences(self):
        result = complete_day(series(), START)
        self.assertEqual(set(result), set(IDS))
        self.assertTrue(all(values == [400.0] * 24 for values in result.values()))

    def test_missing_duplicate_nonfinite_rejected(self):
        for mutation in ("missing", "duplicate", "nan", "infinity", "negative"):
            with self.subTest(mutation=mutation):
                values = series()
                if mutation == "missing": values["MISO"].pop()
                elif mutation == "duplicate": values["MISO"].append(values["MISO"][0])
                else: values["MISO"][0] = (START, {"nan": float("nan"), "infinity": float("inf"), "negative": -1}[mutation])
                with self.assertRaises(ValueError): complete_day(values, START)

    def test_modes_are_explicit(self):
        with self.assertRaises(ValueError): prepare("automatic")
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises((ValueError, FileNotFoundError)): prepare("historical", Path(directory))

    def test_synthetic_reproducible_prices(self):
        first = prepare("synthetic")
        second = prepare("synthetic")
        first["provenance"].pop("preparedAt")
        second["provenance"].pop("preparedAt")
        self.assertEqual(first, second)
        self.assertEqual(len(first["regions"]), 5)
        self.assertTrue(all(len(r["carbonGPerKwh"]) == 24 for r in first["regions"]))
        self.assertTrue(all(r["carbonSource"]["kind"] == "synthetic" for r in first["regions"]))
        # Independent hand-calculated first LCG values; regression against a changed seed/order.
        self.assertEqual(first["regions"][0]["priceUsdPerMwh"][:3], [44, 40, 54])

    def test_invalid_output_preserves_existing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "scenario.json"
            target.write_text("previous-valid-output", encoding="utf-8")
            invalid = prepare("synthetic")
            invalid["regions"][0]["carbonGPerKwh"][0] = float("nan")
            with self.assertRaises(ValueError): write_scenario(invalid, target)
            self.assertEqual(target.read_text(encoding="utf-8"), "previous-valid-output")
            self.assertEqual(list(Path(directory).iterdir()), [target])

    def test_valid_atomic_json_output(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "scenario.json"
            scenario = prepare("synthetic")
            write_scenario(scenario, target)
            self.assertEqual(json.loads(target.read_text(encoding="utf-8")), scenario)

if __name__ == "__main__":
    unittest.main()
