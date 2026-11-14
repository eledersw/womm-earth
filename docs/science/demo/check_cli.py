"""Run the five selected cases through the unmodified current case CLI.

Use the ignored science environment. This requires network access and records
current application outputs separately from the independent v1 reference.
"""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SELECTED = ["co-temperature", "az-wetness", "wi-snow", "wi-aod", "wi-precipitation"]


def run(cid, case):
    args = [sys.executable, "-B", str(ROOT / "scripts/case_cli.py"), "--var", case["variable"],
            "--region", case["region_id"], "--start", str(case["start"]),
            "--end", str(case["end"]), "--season", case["season"], "--json"]
    completed = subprocess.run(args, capture_output=True, text=True, timeout=90)
    check = dict(command=args[2:], returncode=completed.returncode, stderr=completed.stderr)
    if completed.returncode == 0:
        payload = json.loads(completed.stdout)
        result = payload["results"][0]
        check.update(stats=result["stats"], verdict=result["verdict"],
                     provenance=result["provenance"], monthly_count=len(result["monthly"]),
                     yearly_count=len(result["yearly"]))
    return cid, check


def main():
    cases = json.loads((HERE / "results.json").read_text())["candidates"]
    with ThreadPoolExecutor(max_workers=2) as pool:
        checks = dict(pool.map(lambda cid: run(cid, cases[cid]), SELECTED))
    record = dict(checked_at_utc=datetime.now(timezone.utc).isoformat(),
                  git_revision=subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
                  power_source_sha256=hashlib.sha256((ROOT / "api/_engine/power.py").read_bytes()).hexdigest(),
                  scope="Unmodified local CLI against live NASA; not a browser/production smoke or METHODS v1 acceptance.",
                  cases=checks)
    (HERE / "cli_checks.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    for cid, check in checks.items():
        print(cid, check["returncode"], check.get("verdict"), check.get("stderr", ""))
    if any(check["returncode"] != 0 for check in checks.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
