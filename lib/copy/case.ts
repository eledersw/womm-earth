// COPY.md is still a draft. Empty/loading copy is provisional; keep it here
// for Story review rather than embedding wording in the components.
export const caseCopy = {
  panel: "Case panel",
  tabs: "Investigation views",
  caseTab: "Case",
  partnerTab: "Partner",
  stepsLabel: "Case steps",
  loading: "Loading…",
  error: "This part of the Case could not be loaded.",
  retry: "Try again",
  controls: {
    variable: "Variable", source: "Source", period: "Period", season: "Season",
    startYear: "Start year", endYear: "End year", startMonth: "Start month", endMonth: "End month",
    removeRegion: "Remove region", addOnGlobe: "Add regions on the globe or in its search box.",
    nearestCellFallback: "This small region uses the nearest grid cell.",
    kinds: { satellite: "Satellite", reanalysis: "Reanalysis (model)" },
    seasons: { ANN: "Annual", DJF: "DJF", MAM: "MAM", JJA: "JJA", SON: "SON", CUSTOM: "Custom" },
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    chart: "Yearly series", year: "Year", yearlyValues: "Yearly values",
    catalogRequired: "Choose an available variable and region before requesting Evidence.",
  },
  steps: {
    lead: {
      label: "Lead",
      helper: "Pick something NASA measures or models, like rainfall or air haze.",
      empty: "Choose a variable to start your Case.",
    },
    scene: {
      label: "Scene",
      helper: "Click the globe or search for a place. Compare up to 4.",
      empty: "Choose a region for your Case.",
    },
    timeline: {
      label: "Timeline",
      helper: "Pick a period and a season.",
      empty: "Choose a Lead to see its available period.",
    },
    evidence: {
      label: "Evidence",
      helper: "What does the data show?",
      empty: "Choose a Lead, Scene and Timeline to see the Evidence.",
    },
    verdict: {
      label: "Verdict",
      helper: "Is there a detectable trend?",
      empty: "The Verdict will appear with the Evidence.",
    },
  },
  tiers: {
    confirmed: "Confirmed",
    not_proven: "Not proven yet",
    no_case: "No case",
    too_short: "Too short to judge",
  },
  evidence: {
    view: "Evidence view", yearly: "Yearly", monthly: "Monthly", raw: "Raw", anomaly: "Anomalies",
    monthlyChart: "Monthly series", anomalyChart: "Monthly anomalies", date: "Date",
    fits: "Points and solid line: yearly values. Solid fitted line: OLS. Shaded band: OLS 95% confidence interval. Dashed line: Sen.",
    annualTests: "The Verdict tests yearly values. Monthly anomalies are for display and correlation only.",
    anomalyNote: "Anomalies subtract each calendar month's average over the selected period.",
    seasonNote: "DJF is labelled by January's year; incomplete seasons at the period boundaries are dropped.",
    missing: "Gaps indicate missing values.",
    provenance: "Data source", warnings: "Data warnings",
  },
  verdict: {
    confirmedStudent: "Over {period}, {variable} in {region} has changed by about {slope} {unit} per decade (Sen's slope). Mann-Kendall with the Hamed–Rao correction detects a trend (p {p}).",
    confirmedScientist: "Mann-Kendall with Hamed–Rao correction: Sen's slope {slope} {unit}/decade (95% CI {low} to {high}), p {p}, n = {n} yearly values. OLS with AR(1)-adjusted SE {agreement}.",
    notProvenStudent: "{variable} in {region} seems to be changing, but the evidence isn't strong enough to be sure yet.",
    notProvenScientist: "Suggestive but not significant at α = 0.05 under the primary Hamed–Rao Mann-Kendall test.",
    estimate: "Estimated detection time: ≈{years} more years, with even odds, assuming slope and noise stay the same. This is an estimate, not a promise.",
    noEstimate: "An additional-years estimate is not available for this Case.",
    noCaseStudent: "We can't see a clear trend in {variable} for {region} over {period}. A small trend may be hidden by variability.",
    noCaseScientist: "No detectable monotonic trend. This doesn't rule out a small trend hidden by variability.",
    tooShortStudent: "There aren't enough valid yearly values here to judge a trend. Try a longer period.",
    tooShortScientist: "The series does not meet the minimum length or coverage requirements: at least 10 valid yearly values and 80% valid years.",
    unavailable: "Statistics are unavailable for this Case.",
    disagreeStudent: "Our two tests don't agree here, so treat this with caution.",
    disagreeScientist: "MK and OLS-AR(1) disagree at α = 0.05; the verdict follows MK.",
    disagreeBadge: "Tests disagree", agrees: "agrees", disagrees: "disagrees",
    table: "Statistical results", method: "Method", slope: "Slope per decade", interval: "95% CI per decade", p: "p-value",
    ols: "OLS (AR(1)-adjusted SE)", mk: "Mann-Kendall (Hamed–Rao)", sen: "Sen",
    n: "Valid yearly values", effectiveN: "OLS effective sample size", tau: "Kendall's tau", phi: "Residual autocorrelation",
    total: "Total change", percent: "% of period mean per decade",
  },
  // Statistical tooltips remain empty until Methods and Story supply wording.
  tooltips: {},
  empty: {
    noMirror: "No mirror found",
    notAvailableHere: "This variable is not available for the selected regions.",
  },
} as const;

export type CaseStep = keyof typeof caseCopy.steps;
