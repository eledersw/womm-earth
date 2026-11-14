// Provisional empty/error wording pending Story's COPY.md completion.
export const partnerCopy = {
  title: "Partner",
  chatLabel: "Ask the Partner", send: "Send", checking: "Checking the data…", openCase: "Open this case",
  chatHistory: "Partner conversation", you: "You", assistant: "Partner", chatRetry: "The partner could not finish this turn. Please try again.",
  tooLong: "The partner reached its response limit. Please ask a shorter question.",
  chatIntro: "Ask about the evidence or explore a new Case. You choose which proposals to open.",
  numberWarning: "Some numbers could not be matched to tool results.",

  explain: "Explain this verdict", loading: "Preparing explanation…", draft: "Draft explanation · being checked",
  stop: "Stop", retry: "Retry explanation", cancelled: "Explanation stopped.",
  refused: "The partner could not explain this Case. The template verdict remains available.",
  busy: "The partner is busy. Please try again shortly.",
  invalid: "This explanation request could not be accepted.",
  grounding: "The explanation could not be verified. Use the template verdict above.",
  readingLevel: "Reading level", student: "Student", scientist: "Scientist",

  offline: "The partner is unavailable. You can still investigate your Case.",
  streamError: "The explanation could not be completed. Please try again.",
  timeout: "The partner took too long to respond. Please try again.",
  starters: [
    "What place are you curious about?",
    "What have you noticed, or heard about, there?",
    "How far back should we look?",
  ],
} as const;
