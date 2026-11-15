// Named aliases for the generated contract types (lib/api-types.ts).
// Import from here, not from lib/api-types.ts directly.
import type { components } from "@/lib/api-types";

type S = components["schemas"];

// Catalogue
export type Variable = S["Variable"];
export type Region = S["Region"];

// Analyze
export type CaseRequest = S["CaseRequest"];
export type AnalyzeResponse = S["AnalyzeResponse"];
export type RegionAnalysis = S["RegionAnalysis"];
export type MonthlyPoint = S["MonthlyPoint"];
export type YearlyPoint = S["YearlyPoint"];
export type FitPoint = S["FitPoint"];
export type TrendStats = S["TrendStats"];
export type Ols = S["Ols"];
export type Mk = S["Mk"];
export type Sen = S["Sen"];
export type Verdict = S["Verdict"];
export type Provenance = S["Provenance"];

// Trend map
export type TrendMapResponse = S["TrendMapResponse"];
export type TrendMapEntry = S["TrendMapEntry"];

// Correlation
export type CorrelateRequest = S["CorrelateRequest"];
export type CorrelateResponse = S["CorrelateResponse"];
export type LagPoint = S["LagPoint"];
export type ScatterPoint = S["ScatterPoint"];

// Mirror
export type MirrorRequest = S["MirrorRequest"];
export type MirrorResponse = S["MirrorResponse"];
export type MirrorBase = S["MirrorBase"];
export type MirrorEntry = S["MirrorEntry"];

// Scan
export type ScanRequest = S["ScanRequest"];
export type ScanResponse = S["ScanResponse"];
export type ScanEntry = S["ScanEntry"];

// Health
export type Health = S["Health"];
