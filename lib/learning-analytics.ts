import type { LearningProgress } from "./learning-progress";
import { shiftLocalDateKey } from "./local-date";

export type DayRecord = {
  lessons: number;
  correctAnswers: number;
  totalAnswers: number;
  minutes: number;
};

export const EMPTY_DAY_RECORD: DayRecord = { lessons: 0, correctAnswers: 0, totalAnswers: 0, minutes: 0 };

export const getDayRecord = (progress: LearningProgress, date: string): DayRecord => ({
  ...EMPTY_DAY_RECORD,
  ...(progress.dailyRecords?.[date] ?? {}),
});

export const calculateAccuracy = (record: DayRecord) => record.totalAnswers ? Math.round((record.correctAnswers / record.totalAnswers) * 100) : 0;

export const getDailyPlan = (progress: LearningProgress, date: string) => {
  const record = getDayRecord(progress, date);
  const goal = progress.dailyGoalLessons ?? 2;
  return { goal, completed: record.lessons, remaining: Math.max(0, goal - record.lessons), isComplete: record.lessons >= goal, record };
};

export const getParentSummary = (progress: LearningProgress, date: string) => {
  const today = getDayRecord(progress, date);
  const days = Object.values(progress.dailyRecords ?? {});
  const totalMinutes = days.reduce((sum, record) => sum + record.minutes, 0);
  const totalAnswers = days.reduce((sum, record) => sum + record.totalAnswers, 0);
  const correctAnswers = days.reduce((sum, record) => sum + record.correctAnswers, 0);
  return {
    today,
    todayAccuracy: calculateAccuracy(today),
    allAccuracy: totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
    totalMinutes,
    totalLessons: progress.completedLessonIds.length,
    reviewCount: progress.reviewWordIds.length,
    streak: progress.streak,
    pronunciationAverage: progress.pronunciationAttempts.length ? Math.round(progress.pronunciationAttempts.reduce((sum, item) => sum + item.score, 0) / progress.pronunciationAttempts.length) : 0,
  };
};

export const getWeeklySummary = (progress: LearningProgress, endDate: string) => {
  const records = Array.from({ length: 7 }, (_, index) => {
    const key = shiftLocalDateKey(endDate, -index);
    return { date: key, ...getDayRecord(progress, key) };
  });
  const lessons = records.reduce((sum, item) => sum + item.lessons, 0);
  const minutes = records.reduce((sum, item) => sum + item.minutes, 0);
  const correctAnswers = records.reduce((sum, item) => sum + item.correctAnswers, 0);
  const totalAnswers = records.reduce((sum, item) => sum + item.totalAnswers, 0);
  const startDate = records[records.length - 1]?.date ?? endDate;
  const speaking = progress.pronunciationAttempts.filter((item) => item.date >= startDate && item.date <= endDate);
  const pronunciationAverage = speaking.length ? Math.round(speaking.reduce((sum, item) => sum + item.score, 0) / speaking.length) : 0;
  return { records: records.reverse(), lessons, minutes, accuracy: totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0, speakingCount: speaking.length, pronunciationAverage };
};
