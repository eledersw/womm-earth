// Provisional empty/error wording pending Story's COPY.md completion.
export const partnerCopy = {
  title: "Ask Gaia",
  chatLabel: "Your question", send: "Send", checking: "Gaia is checking the data…", openCase: "Open this case",
  chatHistory: "Conversation", you: "You", assistant: "Gaia", chatRetry: "No answer this time. Please try again.",
  tooLong: "That answer hit its length limit. Please ask a shorter question.",
  chatIntro: "Gaia is the AI helper. Ask about your results, or where to look next. You choose which suggested cases to open.",
  numberWarning: "Some numbers could not be matched to tool results.",

  explain: "Explanation", loading: "Gaia is preparing an explanation…", draft: "Draft explanation · being checked",
  stop: "Stop", retry: "Retry explanation", cancelled: "Explanation stopped.",
  refused: "This case could not be explained. The verdict still stands.",
  busy: "Too many questions right now. Please try again shortly.",
  invalid: "This explanation request could not be accepted.",
  grounding: "The explanation could not be verified. Use the template verdict above.",
  readingLevel: "Reading level", student: "Student", scientist: "Scientist",

  offline: "Explanations are unavailable right now. You can still investigate your case.",
  streamError: "The explanation could not be completed. Please try again.",
  timeout: "The answer took too long. Please try again.",
  starters: [
    "Is this a real trend, or just natural ups and downs?",
    "What could be causing this change?",
    "Where is the opposite trend happening?",
  ],
} as const;
