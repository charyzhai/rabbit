export type GrammarMistakeRecord = Record<string, { attempts: number; lastMistake: string }>;

export const applyGrammarResult = (mistakes: GrammarMistakeRecord, questionId: string, correct: boolean, date: string): GrammarMistakeRecord => {
  const next = { ...mistakes };
  if (correct) delete next[questionId];
  else next[questionId] = { attempts: (next[questionId]?.attempts ?? 0) + 1, lastMistake: date };
  return next;
};

export const orderedGrammarMistakeIds = (mistakes: GrammarMistakeRecord) => Object.entries(mistakes).sort(([, a], [, b]) => b.lastMistake.localeCompare(a.lastMistake) || b.attempts - a.attempts).map(([id]) => id);
