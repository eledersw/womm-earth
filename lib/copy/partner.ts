// Provisional empty/error wording pending Story's COPY.md completion.
export const partnerCopy = {
  title: "Ask a question",
  chatLabel: "Your question", send: "Send", checking: "Checking the data…", openCase: "Open this case",
  chatHistory: "Conversation", you: "You", assistant: "Answer", chatRetry: "No answer this time. Please try again.",
  tooLong: "That answer hit its length limit. Please ask a shorter question.",
  chatIntro: "Ask about the evidence, or where to look next. You choose which suggested cases to open.",
  numberWarning: "Some numbers could not be matched to tool results.",

  explain: "Explanation", loading: "Preparing explanation…", draft: "Draft explanation · being checked",
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
    "What place are you curious about?",
    "What have you noticed, or heard about, there?",
    "How far back should we look?",
  ],
} as const;
