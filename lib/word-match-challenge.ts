export const WORD_MATCH_TIME_LIMIT_SECONDS = 60;

export const getTimedWordMatchBonus = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.min(WORD_MATCH_TIME_LIMIT_SECONDS, Math.ceil(seconds)));
  const remaining = WORD_MATCH_TIME_LIMIT_SECONDS - safeSeconds;
  if (remaining >= 40) return 5;
  if (remaining >= 28) return 3;
  if (remaining >= 15) return 2;
  return remaining > 0 ? 1 : 0;
};

export const isNewBestTime = (previousSeconds: number | undefined, seconds: number) => previousSeconds === undefined || seconds < previousSeconds;
