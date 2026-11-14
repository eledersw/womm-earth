// Procedural labels are provisional pending Story's final demo captions.
export const tourCopy = {
  watch: "Watch this case", open: "Open this case",
  title: "Guided cases", unavailable: "Guided demonstration cases are being prepared. You can still investigate your own Case.",
  current: "Guide me through this Case", currentTitle: "Your Case, step by step",
  prev: "Previous", next: "Next", play: "Play", pause: "Pause", replay: "Play again", exit: "Exit guide",
  step: "Step", of: "of", restore: "Exit returns to your original Case. Investigate runs only when you press its button.",
  autoplay: "Play advances every 6 seconds and pauses if you change the Case.",
  captions: [
    "Lead: choose the variable you want to investigate. Read its definition, units and source.",
    "Scene: choose places on the globe or search for a region. You can compare up to four.",
    "Timeline: choose the period and season. Use the available years for your variable.",
    "Evidence: press Investigate when your Case is ready. Inspect yearly values, monthly values and anomalies in the results pane.",
    "Verdict: read what the engine reports and its limitations. An unavailable result is a reason to adjust the Case, not invent a conclusion.",
  ],
} as const;
