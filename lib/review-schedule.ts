export type ReviewStep = { box: number; dueDate: string; lastReviewedAt: string | null };
export type ReviewSchedule = Record<string, ReviewStep>;

const INTERVAL_DAYS = [0, 1, 3, 7, 14];
export const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};
export const scheduleWrongAnswer = (schedule: ReviewSchedule, wordId: string, date: string): ReviewSchedule => ({ ...schedule, [wordId]: { box: 0, dueDate: date, lastReviewedAt: null } });
export const scheduleReviewSuccess = (schedule: ReviewSchedule, wordId: string, date: string): ReviewSchedule => {
  const current = schedule[wordId] ?? { box: 0, dueDate: date, lastReviewedAt: null };
  const nextBox = Math.min(current.box + 1, INTERVAL_DAYS.length - 1);
  return { ...schedule, [wordId]: { box: nextBox, dueDate: addDays(date, INTERVAL_DAYS[nextBox]), lastReviewedAt: date } };
};
export const dueReviewIds = (schedule: ReviewSchedule, date: string) => Object.entries(schedule).filter(([, item]) => item.dueDate <= date).map(([id]) => id);
export const nextDueDate = (schedule: ReviewSchedule) => Object.values(schedule).map((item) => item.dueDate).sort()[0] ?? null;
