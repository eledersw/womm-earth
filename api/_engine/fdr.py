"""Benjamini–Hochberg adjustment over one complete inference family."""
import numpy as np


def bh(p_values: np.ndarray) -> np.ndarray:
    p = np.asarray(p_values, dtype=float)
    result = np.full(p.shape, np.nan, dtype=float)
    valid = np.isfinite(p) & (p >= 0) & (p <= 1)
    values = p[valid]
    if values.size:
        order = np.argsort(values, kind="stable")
        scaled = values[order] * values.size / np.arange(1, values.size + 1)
        adjusted = np.minimum.accumulate(scaled[::-1])[::-1]
        restored = np.empty_like(adjusted)
        restored[order] = np.minimum(1, adjusted)
        result[valid] = restored
    return result
