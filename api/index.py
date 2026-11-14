"""FastAPI entrypoint — the ONLY Vercel Python function in api/.

Stub created by Eleder in the scaffold; owned by Oier from the first merge on
(docs/process/OWNERSHIP.md). Keep every other Python module in an
underscore-prefixed folder (api/_engine/, api/_data/, ...) so Vercel doesn't
turn it into its own function.
"""

import sys
import time
from pathlib import Path

_IMPORT_START = time.perf_counter()
sys.path.insert(0, str(Path(__file__).parent))

import numpy  # noqa: E402
import scipy  # noqa: E402
from fastapi import FastAPI  # noqa: E402

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Time spent importing this module (numpy, scipy, FastAPI): the cold-start cost.
_COLD_START_MS = round((time.perf_counter() - _IMPORT_START) * 1000, 1)


@app.get("/api/py/health")
def health() -> dict:
    return {
        "ok": True,
        "numpy": numpy.__version__,
        "scipy": scipy.__version__,
        "python": sys.version.split()[0],
        "cold_start_ms": _COLD_START_MS,
    }
