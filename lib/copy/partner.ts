// Provisional empty/error wording pending Story's COPY.md completion.
export const partnerCopy = {
  title: "Ask Gaia",
  chatLabel: "Your question", send: "Send", checking: "Gaia is checking the data…", openCase: "Open this case",
  chatHistory: "Conversation", you: "You", assistant: "Gaia", chatRetry: "No answer this time. Please try again.",
  tooLong: "That answer hit its length limit. Please ask a shorter question.",
  chatIntro: "Gaia is the AI helper. Ask about your results, or compare places you are curious about (up to four at a time). When Gaia suggests a case, it shows on the globe and you choose whether to open it.",
  rankingBlocked: "I can't rank the whole world: that would mean analysing hundreds of places for one answer. Name up to four places and I'll compare them, for example \"Is Spain warming faster than Norway?\"",
  proposalShown: "Shown on the globe.",
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
  askMeLead: "Don't understand the results? Ask me!",
  askMeBody: "I can explain every number and word on the verdict in plain language, no statistics background needed.",
  resultStarters: [
    "Explain my results in simple words",
    "What does this verdict actually mean?",
    "What do the numbers on the card mean?",
  ],
  starters: [
    "Is this a real trend, or just natural ups and downs?",
    "What could be causing this change?",
    "Is the Arctic warming faster than the Sahel?",
  ],
} as const;
