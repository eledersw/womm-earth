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
  fixture: {
    notice: "Example Case · illustrative test data",
    disclaimer: "These values come from a test fixture. They are not observations or a validated scientific result.",
    chart: "Example yearly series",
    caption: "Illustrative test values only. The live Case will replace this example.",
    year: "Year",
    yearlyValues: "Yearly values",
    verdict: "Example verdict from the test fixture",
    source: "Source represented by the fixture",
    kinds: { satellite: "Satellite", reanalysis: "Reanalysis (model)" },
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
  // Statistical tooltips remain empty until Methods and Story supply wording.
  tooltips: {},
  empty: {
    noMirror: "No mirror found",
    notAvailableHere: "This variable is not available for the selected regions.",
  },
} as const;

export type CaseStep = keyof typeof caseCopy.steps;
