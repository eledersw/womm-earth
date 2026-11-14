"""Pydantic v2 contract shared by the Python API and generated TypeScript types."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

Season = Literal["ANN", "DJF", "MAM", "JJA", "SON", "CUSTOM"]
Tier = Literal["confirmed", "not_proven", "no_case", "too_short"]
RegionType = Literal["country", "state", "ocean", "named"]
VariableKind = Literal["satellite", "reanalysis"]
PowerCommunity = Literal["AG", "RE", "SB"]


class Variable(BaseModel):
    id: str
    name: str
    unit: str
    source: str
    instrument: str | None
    kind: VariableKind
    start_year: int
    end_year: int
    land_only: bool
    ratio_scale: bool
    definition_student: str
    definition_scientist: str
    doi: str | None
    signed_off: bool
    power_community: PowerCommunity = "AG"
    power_type: str | None = None


class Region(BaseModel):
    id: str
    name: str
    type: RegionType
    centroid: tuple[float, float]
    bbox: tuple[float, float, float, float]
    nearest_cell_fallback: bool
    valid_variables: list[str]
    parent: str | None


def _months_are_contiguous(months: list[int]) -> bool:
    return all(months[i + 1] == months[i] % 12 + 1 for i in range(len(months) - 1))


class CaseRequest(BaseModel):
    variable: str
    regions: list[str] = Field(min_length=1, max_length=4)
    start: int
    end: int
    season: Season = "ANN"
    months: list[int] | None = None

    @model_validator(mode="after")
    def validate_period_and_months(self):
        if self.end < self.start:
            raise ValueError("end must be greater than or equal to start")
        if self.season == "CUSTOM":
            if not self.months:
                raise ValueError("months are required for CUSTOM season")
            if any(month < 1 or month > 12 for month in self.months):
                raise ValueError("months must be between 1 and 12")
            if len(set(self.months)) != len(self.months) or not _months_are_contiguous(self.months):
                raise ValueError("months must be contiguous in cyclic order")
        return self


class MirrorRequest(CaseRequest):
    regions: list[str] = Field(min_length=1, max_length=1)


class TrendMapRequest(BaseModel):
    variable: str
    start: int
    end: int
    season: Season = "ANN"
    months: list[int] | None = None

    @model_validator(mode="after")
    def validate_period_and_months(self):
        if self.end < self.start:
            raise ValueError("end must be greater than or equal to start")
        if self.season == "CUSTOM":
            if not self.months:
                raise ValueError("months are required for CUSTOM season")
            if any(month < 1 or month > 12 for month in self.months):
                raise ValueError("months must be between 1 and 12")
            if len(set(self.months)) != len(self.months) or not _months_are_contiguous(self.months):
                raise ValueError("months must be contiguous in cyclic order")
        return self


class MonthlyPoint(BaseModel):
    t: str
    value: float | None
    anomaly: float | None


class YearlyPoint(BaseModel):
    year: int
    value: float | None


class FitPoint(BaseModel):
    year: int
    ols: float
    ols_low: float
    ols_high: float
    sen: float


class Ols(BaseModel):
    slope: float
    intercept: float
    se: float
    p: float
    ci_low: float
    ci_high: float
    r2: float
    n_eff: float


class Mk(BaseModel):
    p: float
    p_naive: float
    z: float
    tau: float


class Sen(BaseModel):
    slope: float
    intercept: float
    ci_low: float
    ci_high: float


class TrendStats(BaseModel):
    n_years: int
    phi: float
    resid_sd: float
    ols: Ols
    mk: Mk
    sen: Sen
    tests_agree: bool
    period_mean: float
    change_per_decade: float
    total_change: float
    pct_of_mean_per_decade: float | None


class Verdict(BaseModel):
    tier: Tier
    years_needed: int | None
    reason: str | None


class Provenance(BaseModel):
    source: str
    instrument: str | None
    product: str | None
    doi: str | None
    kind: VariableKind


class RegionAnalysis(BaseModel):
    region: Region
    monthly: list[MonthlyPoint]
    yearly: list[YearlyPoint]
    fit: list[FitPoint]
    stats: TrendStats | None
    verdict: Verdict
    provenance: Provenance
    warnings: list[str]


class AnalyzeResponse(BaseModel):
    case: CaseRequest
    results: list[RegionAnalysis]


class TrendMapEntry(BaseModel):
    slope_per_decade: float
    p: float
    q: float
    tier: Tier


class TrendMapResponse(BaseModel):
    variable: str
    start: int
    end: int
    season: Season
    entries: dict[str, TrendMapEntry]


class CorrelateRequest(BaseModel):
    var_x: str
    var_y: str
    region: str
    start: int
    end: int
    season: Season = "ANN"
    months: list[int] | None = None
    max_lag: int = Field(default=6, ge=0, le=6)

    @model_validator(mode="after")
    def validate_period_and_months(self):
        if self.end < self.start:
            raise ValueError("end must be greater than or equal to start")
        if self.season == "CUSTOM":
            if not self.months:
                raise ValueError("months are required for CUSTOM season")
            if any(month < 1 or month > 12 for month in self.months):
                raise ValueError("months must be between 1 and 12")
            if len(set(self.months)) != len(self.months) or not _months_are_contiguous(self.months):
                raise ValueError("months must be contiguous in cyclic order")
        return self


class LagPoint(BaseModel):
    lag: int
    r: float | None


class ScatterPoint(BaseModel):
    t: str
    x: float
    y: float


class CorrelateResponse(BaseModel):
    n: int
    n_eff: float
    pearson_raw: float | None
    pearson_detrended: float | None
    spearman_raw: float | None
    spearman_detrended: float | None
    p_raw: float | None
    p_detrended: float | None
    best_lag: int | None
    best_lag_r: float | None
    lags: list[LagPoint]
    scatter: list[ScatterPoint]
    warning: Literal["both_trending"] | None


class MirrorBase(BaseModel):
    region: str
    slope_per_decade: float
    p: float
    z: float
    tier: Tier


class MirrorEntry(BaseModel):
    region: str
    slope_per_decade: float
    p: float
    z: float


class MirrorResponse(BaseModel):
    base: MirrorBase
    mirrors: list[MirrorEntry]
    none_found: bool


class ScanRequest(BaseModel):
    region: str
    start: int
    end: int

    @model_validator(mode="after")
    def validate_period(self):
        if self.end < self.start:
            raise ValueError("end must be greater than or equal to start")
        return self


class ScanEntry(BaseModel):
    variable: str
    season: Season
    slope_per_decade: float
    p: float
    q: float
    tier: Tier


class ScanResponse(BaseModel):
    region: str
    entries: list[ScanEntry]


class Health(BaseModel):
    ok: bool
    python: str
    numpy: str
    scipy: str
    cold_start_ms: float
