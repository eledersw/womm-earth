// Questions Gaia refuses before calling Claude or the data API: world rankings
// ("What is the hottest country?") would need hundreds of analyses for one answer.
// Comparisons of named places, or of the places in the user's Case, stay allowed.

const SUPERLATIVE = /\b(hottest|coldest|warmest|coolest|wettest|driest|rainiest|snowiest|windiest|sunniest|cloudiest|humid+est|most|least|fastest|slowest|biggest|largest|smallest|highest|lowest|best|worst|strongest|weakest|extreme)\b/i;
const ANY_PLACE = /\b(country|countries|nation|nations|place|places|region|regions|state|states|province|provinces|city|cities|continent|continents|ocean|oceans|area|areas|spot|spots|world|earth|planet|globe|anywhere|everywhere)\b/i;
const RANKING = /\b(rank|ranking|ranked|top\s*(\d+|ten|five|three)|leaderboard|league table|list (all|every|of all)|sort (all|every))\b/i;
const EVERY_PLACE = /\b(all|every|each)\s+(the\s+)?(countr|region|state|place|cit|continent|ocean|province)/i;
// "my regions", "these places", "between Spain and Italy": a bounded comparison.
const BOUNDED = /\b(my|these|those|this case|the case|selected|chosen|between|of the (two|three|four)|of them|both)\b/i;

/** True for questions that ask Gaia to rank or scan the whole world. */
export function isWorldRanking(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  if (RANKING.test(q) || EVERY_PLACE.test(q)) return !BOUNDED.test(q) || EVERY_PLACE.test(q);
  return SUPERLATIVE.test(q) && ANY_PLACE.test(q) && !BOUNDED.test(q);
}

/** Data lookups (analyses, mirror searches, scans) Claude may run for one question. */
export const MAX_LOOKUPS_PER_QUESTION = 3;
