import type { LessonSkill, ReviewWord } from "./learning-data";
import type { LearningProgress } from "./learning-progress";
import { LESSONS, LEVELS } from "./learning-data";
import { shiftLocalDateKey } from "./local-date";

export const STREAK_MILESTONES = [3, 7, 14, 30, 60] as const;

const isoOffset = (endDate: string, offset: number) => shiftLocalDateKey(endDate, -offset);

export const getStreakMilestone = (progress: LearningProgress) => STREAK_MILESTONES.find((days) => progress.streak >= days && !progress.claimedMilestones.includes(days)) ?? null;

export const getVocabularyTrend = (progress: LearningProgress, endDate: string, days = 7) => Array.from({ length: days }, (_, index) => {
  const date = isoOffset(endDate, days - index - 1);
  const matches = progress.wordMatchHistory.filter((item) => item.date === date);
  const record = progress.dailyRecords[date];
  const value = matches.length ? Math.round((matches.filter((item) => item.correct).length / matches.length) * 100) : record?.totalAnswers ? Math.round((record.correctAnswers / record.totalAnswers) * 100) : null;
  return { date, label: date.slice(5), value };
});

export const getSkillTrend = (progress: LearningProgress, endDate: string, skills: LessonSkill[] = ["meaning", "spelling", "context", "speaking"], days = 7) => skills.map((skill) => ({ skill, values: Array.from({ length: days }, (_, index) => {
  const date = isoOffset(endDate, days - index - 1);
  return { date, label: date.slice(5), value: progress.dailySkillPractice[date]?.[skill] ?? 0 };
}) }));

export const getParentSkillTrends = (progress: LearningProgress, endDate: string, days = 7) => {
  const groups: Array<{ label: string; color: string; skills: LessonSkill[] }> = [
    { label: "词义", color: "#4A9FE8", skills: ["meaning"] },
    { label: "听辨/拼写", color: "#F2A23A", skills: ["listening", "spelling"] },
    { label: "语境", color: "#46A758", skills: ["context"] },
    { label: "跟读", color: "#7B6FEA", skills: ["speaking"] },
  ];
  return groups.map((group) => ({ ...group, values: Array.from({ length: days }, (_, index) => {
    const date = isoOffset(endDate, days - index - 1);
    const aggregate = group.skills.reduce((sum, skill) => { const value = progress.dailySkillMastery[date]?.[skill]; return { correct: sum.correct + (value?.correct ?? 0), total: sum.total + (value?.total ?? 0) }; }, { correct: 0, total: 0 });
    return { date, label: date.slice(5), value: aggregate.total ? Math.round((aggregate.correct / aggregate.total) * 100) : null };
  }) }));
};

export type GradeBestAccuracySummary = {
  levelId: string;
  grade: string;
  title: string;
  color: string;
  averageBestAccuracy: number | null;
  recordedLessons: number;
  totalLessons: number;
  needsConsolidation: boolean;
};

export const getGradeBestAccuracySummaries = (progress: LearningProgress): GradeBestAccuracySummary[] => LEVELS.map((level) => {
  const lessonIds = LESSONS.filter((lesson) => lesson.levelId === level.id).map((lesson) => lesson.id);
  const recordedAccuracies = lessonIds.map((lessonId) => progress.lessonBestAccuracy[lessonId]).filter((accuracy): accuracy is number => typeof accuracy === "number");
  const averageBestAccuracy = recordedAccuracies.length ? Math.round(recordedAccuracies.reduce((sum, accuracy) => sum + accuracy, 0) / recordedAccuracies.length) : null;
  return { levelId: level.id, grade: level.title.split(" ")[0] ?? level.id.toUpperCase(), title: level.title, color: level.color, averageBestAccuracy, recordedLessons: recordedAccuracies.length, totalLessons: lessonIds.length, needsConsolidation: averageBestAccuracy !== null && averageBestAccuracy < 80 };
});

export const getLowAccuracyLessonIdsForLevel = (progress: LearningProgress, levelId: string) => LESSONS.filter((lesson) => lesson.levelId === levelId && (progress.lessonBestAccuracy[lesson.id] ?? 100) < 80).map((lesson) => lesson.id);

export const getWeakWords = (progress: LearningProgress, words: ReviewWord[], limit = 4) => {
  const byId = new Map(words.map((word) => [word.id, word]));
  const fromMatch = Object.entries(progress.wordMatchRecords).filter(([, item]) => item.total > 0 && item.correct / item.total < 0.75).sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)).map(([id]) => id);
  const ids = Array.from(new Set([...fromMatch, ...progress.reviewWordIds])).slice(0, limit);
  return ids.map((id) => byId.get(id)).filter((word): word is ReviewWord => Boolean(word));
};

export const getModuleActivitySummary = (progress: LearningProgress) => [
  { id: "material", label: "新增词组", ...progress.moduleActivity.material },
  { id: "micro-story", label: "微故事", ...progress.moduleActivity["micro-story"] },
  { id: "reading", label: "阅读", ...progress.moduleActivity.reading },
  { id: "dialogue", label: "对话", ...progress.moduleActivity.dialogue },
];

type WeekMetrics = { lessons: number; minutes: number; accuracy: number; answers: number };
const getWeekMetrics = (progress: LearningProgress, endDate: string): WeekMetrics => {
  const days = Array.from({ length: 7 }, (_, index) => isoOffset(endDate, index));
  const records = days.map((date) => progress.dailyRecords[date]).filter((record): record is NonNullable<typeof record> => Boolean(record));
  const lessons = records.reduce((sum, record) => sum + record.lessons, 0);
  const minutes = records.reduce((sum, record) => sum + record.minutes, 0);
  const correct = records.reduce((sum, record) => sum + record.correctAnswers, 0);
  const answers = records.reduce((sum, record) => sum + record.totalAnswers, 0);
  return { lessons, minutes, accuracy: answers ? Math.round((correct / answers) * 100) : 0, answers };
};

export const getWeekComparison = (progress: LearningProgress, endDate: string) => {
  const current = getWeekMetrics(progress, endDate);
  const previous = getWeekMetrics(progress, isoOffset(endDate, 7));
  const hasPreviousData = previous.lessons > 0 || previous.minutes > 0 || previous.answers > 0;
  return { current, previous, hasPreviousData, lessonDelta: current.lessons - previous.lessons, minuteDelta: current.minutes - previous.minutes, accuracyDelta: current.accuracy - previous.accuracy };
};

export const getGoalAdjustment = (progress: LearningProgress, endDate: string) => {
  const comparison = getWeekComparison(progress, endDate);
  const reviewCount = progress.reviewWordIds.length;
  const currentGoal = progress.dailyGoalLessons ?? 2;
  if (comparison.current.lessons === 0) return { mode: "轻启程", goal: 1, minutes: 4, message: "本周还没有形成学习记录，建议先从每天1关、约4分钟开始，建立稳定习惯。" };
  if (comparison.current.accuracy < 70 || reviewCount >= 5) return { mode: "先巩固", goal: 1, minutes: 4, message: `当前有${reviewCount}个待巩固词汇或正确率需要稳一稳，建议每天1关，先完成复习再开启新关。` };
  if (comparison.current.lessons >= currentGoal * 5 && comparison.current.accuracy >= 85 && reviewCount <= 2) return { mode: "小步提升", goal: Math.min(4, currentGoal + 1), minutes: 4, message: "本周完成量和正确率都很稳定，可尝试每天多完成1关，仍保持每次约4分钟。" };
  return { mode: "保持节奏", goal: currentGoal, minutes: 4, message: "当前节奏适合孩子，建议保持每天固定时段完成学习，再留一点时间读词或跟读。" };
};
