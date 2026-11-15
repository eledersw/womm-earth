// Landing page copy (Eleder). From the team's project text, condensed for the page.
export const landingCopy = {
  title: "WOMM Earth · Read the Planet. See Beyond the Data.",
  description:
    "Investigate how Earth is changing with NASA POWER data, honest trend statistics and Gaia, an AI guide grounded in the evidence.",
  launch: "Launch App",
  watch: "Watch the demo",
  github: "GitHub",
  githubUrl: "https://github.com/eledersw/womm-earth",
  nav: [
    { href: "#how", label: "How it works" },
    { href: "#gaia", label: "Gaia" },
    { href: "#built", label: "How it's built" },
    { href: "#team", label: "Team" },
  ],
  hero: {
    lines: ["Read the Planet.", "See Beyond the Data."],
    sub: "Investigate how Earth is changing with NASA data, honest statistics and Gaia, an AI guide that only quotes the evidence.",
    shotAlt: "WOMM Earth with Belgium and the Netherlands selected on the 3D globe, air temperature, 2000 to 2020",
  },
  demo: {
    title: "An investigation in thirty seconds.",
    body: "Belgium and the Netherlands, air temperature, 2000 to 2020, annual. Then a correlation, a multivariable comparison and a question for Gaia.",
  },
  questions: {
    title: "Every investigation starts with a question.",
    items: ["Is Colorado getting warmer?", "Is Arizona's root-zone soil getting drier?", "Is Wisconsin's winter snowpack getting shallower?"],
    body: "Questions like these connect Earth science to places people recognize. Answering them takes care: the variable, the place, the season, the length of the record and natural variability all change what we can conclude.",
  },
  steps: {
    title: "From curiosity to evidence, in five steps.",
    body: "Every investigation is a case. The case lives in the page URL, so anyone can open the same investigation.",
    items: [
      { name: "Lead", what: "The what", text: "Pick a NASA POWER variable: air temperature, precipitation, soil wetness, snow depth, cloud cover, aerosol optical depth and more." },
      { name: "Scene", what: "The where", text: "Select places on the 3D globe or find them in search. Compare up to four regions in one investigation." },
      { name: "Timeline", what: "The when", text: "Set the study period and choose annual averages, one season, or a custom set of months." },
      { name: "Evidence", what: "The results", text: "Press Investigate to see monthly values, anomalies, yearly or seasonal averages and the estimated trend." },
      { name: "Verdict", what: "The judgement", text: "Read the rate of change, its uncertainty and a plain-language verdict. Then ask Gaia a follow-up question." },
    ],
  },
  evidence: {
    title: "Uncertainty is part of the answer.",
    chartAlt: "Yearly air temperature for Belgium and the Netherlands with fitted trends and confidence bands",
    tests: {
      title: "Two tests, one honest verdict",
      body: "Trends are tested on one value per year, so related months are not counted as independent evidence. Sen's slope gives the rate of change; a modified, autocorrelation-aware Mann-Kendall test and an adjusted linear regression judge it. Confirmed needs both.",
    },
    tiers: [
      { name: "Confirmed", text: "Both tests pass the nominal significance threshold." },
      { name: "Not proven yet", text: "Not enough evidence yet, with an estimate of how many more years might settle it." },
      { name: "No case", text: "No detectable steady trend. That is not the same as no change." },
      { name: "Too short to judge", text: "Not enough usable years for a fair test." },
    ],
    correlation: { title: "Correlation", text: "Compare two variables in one region on de-seasoned monthly anomalies, raw and detrended.", alt: "Correlation between air temperature and sunlight in Belgium" },
    radarLegend: [{ name: "Belgium", pen: "var(--series-1)" }, { name: "Netherlands", pen: "var(--series-2)" }],
    radar: { title: "Multivariable comparison", text: "See how regions compare across several variables at once, on one radar chart.", alt: "Radar chart comparing Belgium and the Netherlands across three variables" },
  },
  gaia: {
    title: "Meet Gaia, the explanation layer.",
    body: "Gaia, built on Claude, helps you read the evidence and ask better follow-up questions. It follows two strict rules.",
    rules: [
      "Every number comes from the statistics engine, never from memory.",
      "Every physical explanation comes from a curated, cited process card.",
    ],
    cards: "The cards keep easy-to-miss distinctions in view: snow depth is not snowfall, soil wetness is not groundwater, and aerosol optical depth is not surface smoke exposure.",
    verdict: "The engine produces the verdict. Gaia helps you understand it, its assumptions and the questions it leaves open.",
    alt: "Gaia explaining what Not proven yet means for Belgium and the Netherlands",
  },
  data: {
    title: "How NASA data becomes an investigation.",
    body: "Monthly data comes straight from NASA POWER. Its reviewed catalogue covers 16 variables across the atmosphere, land and water, and solar radiation.",
    rows: [
      { name: "MERRA-2", text: "Meteorological and land variables, from a reanalysis that combines observations with a model and data assimilation." },
      { name: "CERES SYN1deg and GEWEX SRB", text: "Radiation, cloud and aerosol variables, from the source products distributed through POWER." },
      { name: "Regional series", text: "Our Python engine turns grid cells into regional series with latitude weighting. Small regions may use the nearest grid cell, and a regional average can hide differences inside it." },
    ],
  },
  impact: {
    title: "Built for classrooms, and for experts.",
    lead: "A detective structure gives learners an active role: choose a question, make a prediction, inspect the evidence and reconsider the conclusion.",
    items: [
      { name: "Students and educators", text: "A starting point for lessons on environmental change, uncertainty and scientific reasoning. Shared case links make an investigation easy to revisit together." },
      { name: "Scientists and experts", text: "Inspect the statistics behind every verdict, and use the multivariable comparison as an exploratory tool across regions." },
    ],
  },
  built: {
    title: "How it's built.",
    body: "We built and tested it with Python reference tests, interface tests and browser tests, with Codex and Claude Code as development assistants and human review of every scientific explanation.",
    stack: ["TypeScript", "React", "Next.js", "react-globe.gl", "Observable Plot", "Python", "FastAPI", "Pydantic", "NumPy", "SciPy", "Claude", "Vercel"],
    graphTitle: "The code, as a map",
    graphBody: "Every module and how it connects, generated from the repository. Drag, zoom and search it.",
    graphOpen: "Open full screen",
    graphFrame: "Interactive map of the WOMM Earth codebase",
  },
  team: {
    title: "Team WOMM.",
    body: "Computer Engineering + Data Science and AI students at the University of Deusto.",
    people: [
      { name: "Eleder Sweeney", role: "Lead and integration" },
      { name: "Oier Zugazaga", role: "Data and statistics engine" },
      { name: "Ekaitz Lazkano", role: "Panel, charts and Gaia" },
      { name: "Sergio Pena", role: "Methods and validity" },
      { name: "Edur Valle", role: "Story and submission" },
    ],
  },
  final: { title: "Read the planet yourself." },
  footer: {
    event: "NASA Space Apps Challenge 2026",
    data: "Data: NASA POWER",
    attribution: "Sources and methods",
  },
} as const;
