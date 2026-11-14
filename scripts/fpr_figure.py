"""Reproduce the false-positive experiment for the validity slide.

Offline dependency: matplotlib. Run from the repository root with
``.venv/bin/python scripts/fpr_figure.py``.
"""

import csv
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))
from _engine.trend import hamed_rao, mann_kendall  # noqa: E402


def experiment(seed: int, n: int, phi: float, trials: int = 1000) -> tuple[float, float]:
    rng = np.random.default_rng(seed)
    naive = corrected = 0
    for _ in range(trials):
        noise = rng.normal(size=n)
        series = noise.copy()
        if phi:
            for i in range(1, n):
                series[i] = phi * series[i - 1] + noise[i]
        naive += mann_kendall(series).p < 0.05
        corrected += hamed_rao(series).p < 0.05
    return naive / trials, corrected / trials


def main() -> None:
    output = ROOT / "docs" / "science" / "figures"
    output.mkdir(parents=True, exist_ok=True)
    rows = [
        ("White noise", 7, 30, 0.0, *experiment(7, 30, 0.0)),
        ("AR(1) noise", 8, 40, 0.6, *experiment(8, 40, 0.6)),
    ]
    with (output / "fpr.csv").open("w", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(["noise", "seed", "n_years", "phi", "naive_fpr", "hamed_rao_fpr"])
        writer.writerows(rows)

    fig, ax = plt.subplots(figsize=(7, 4))
    positions = np.arange(len(rows))
    width = 0.34
    naive = ax.bar(positions - width / 2, [row[4] * 100 for row in rows], width, label="Ordinary MK")
    corrected = ax.bar(positions + width / 2, [row[5] * 100 for row in rows], width, label="Hamed–Rao")
    ax.axhline(5, color="black", linestyle="--", linewidth=1, label="Nominal α = 5%")
    ax.bar_label(naive, fmt="%.1f%%", padding=3)
    ax.bar_label(corrected, fmt="%.1f%%", padding=3)
    ax.set_xticks(positions, [row[0] for row in rows])
    ax.set_ylim(0, 37)
    ax.set_ylabel("Empirical false positives (%)")
    ax.set_title("1,000 no-trend series per scenario")
    ax.legend(frameon=False)
    fig.tight_layout()
    fig.savefig(output / "fpr.png", dpi=180)
    plt.close(fig)


if __name__ == "__main__":
    main()
