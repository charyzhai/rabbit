import AsyncStorage from "@react-native-async-storage/async-storage";
import { EMPTY_DAY_RECORD, type DayRecord } from "./learning-analytics";
import type { LessonSkill } from "./learning-data";
import { calculateNextStreak, dayDifference, isLevelUnlocked } from "./progress-rules";
import { dueReviewIds, scheduleReviewSuccess, scheduleWrongAnswer, type ReviewSchedule } from "./review-schedule";
import { applyGrammarResult, orderedGrammarMistakeIds, type GrammarMistakeRecord } from "./grammar-review";
import { getTimedWordMatchBonus, isNewBestTime } from "./word-match-challenge";
import { getMaterialBatchBadge } from "./material-learning";
import { localDateKey } from "./local-date";

export { calculateNextStreak, dayDifference, isLevelUnlocked } from "./progress-rules";

const LEGACY_PROGRESS_KEY = "rabbit-english-quest-progress-v1";
const FAMILY_KEY = "rabbit-english-quest-family-v1";

export type RecentLearning = { kind: "lesson"; lessonId: string; updatedAt: number } | { kind: "reading"; readingId: string; updatedAt: number } | { kind: "material"; levelId: string; batchIndex: number; updatedAt: number } | { kind: "micro-story"; levelId: string; updatedAt: number } | { kind: "dialogue"; updatedAt: number };
export type LearningProgress = {
  completedLessonIds: string[];
  totalStars: number;
  streak: number;
  lastStudyDate: string | null;
  reviewWordIds: string[];
  dailyGoalLessons: number;
  dailyRecords: Record<string, DayRecord>;
  pronunciationAttempts: Array<{ date: string; score: number }>;
  skillPracticeCounts: Record<LessonSkill, number>;
  dailySkillPractice: Record<string, Partial<Record<LessonSkill, number>>>;
  dailySkillMastery: Record<string, Partial<Record<LessonSkill, { correct: number; total: number }>>>;
  wordMatchRecords: Record<string, { correct: number; total: number; lastPracticed: string }>;
  wordMatchHistory: Array<{ wordId: string; correct: boolean; date: string }>;
  bossCompletedLevelIds: string[];
  claimedMilestones: number[];
  celebratedLevelIds: string[];
  completedReadingIds: string[];
  readingHistory: Array<{ readingId: string; date: string }>;
  reviewSchedule: ReviewSchedule;
  dialoguePronunciationAttempts: Array<{ dialogueId: string; date: string; score: number; stars: number }>;
  grammarMistakes: GrammarMistakeRecord;
  completedWordMatchRoundIds: string[];
  claimedBadgeCollectionMilestones: number[];
  wordMatchTimedBestSeconds: Record<string, number>;
  bossCompletedAt: Record<string, string>;
  claimedBadgeCollectionAt: Record<string, string>;
  rareBadgeUnlockedAt: Record<string, string>;
  lessonBestAccuracy: Record<string, number>;
  lessonBestStars: Record<string, number>;
  materialBatchBadges: Record<string, { earnedAt: string; stars: number }>;
  completedMicroStoryIds: string[];
  moduleActivity: Record<LearningActivityModule, ModuleActivity>;
  recentLearning?: RecentLearning | null;
};
export type LearningActivityModule = "material" | "reading" | "micro-story" | "dialogue";
export type ModuleActivity = { attempts: number; correct: number; completed: number };
export type ChildProfile = { id: string; name: string; avatar: string; createdAt: string; progress: LearningProgress };
export type FamilyState = { activeProfileId: string; profiles: ChildProfile[] };

export const DEFAULT_SKILL_PRACTICE_COUNTS: Record<LessonSkill, number> = { meaning: 0, listening: 0, spelling: 0, "word-complete": 0, context: 0, speaking: 0, grammar: 0 };
const emptyModuleActivity = (): Record<LearningActivityModule, ModuleActivity> => ({ material: { attempts: 0, correct: 0, completed: 0 }, reading: { attempts: 0, correct: 0, completed: 0 }, "micro-story": { attempts: 0, correct: 0, completed: 0 }, dialogue: { attempts: 0, correct: 0, completed: 0 } });
export const DEFAULT_PROGRESS: LearningProgress = { completedLessonIds: [], totalStars: 0, streak: 0, lastStudyDate: null, reviewWordIds: [], dailyGoalLessons: 2, dailyRecords: {}, pronunciationAttempts: [], skillPracticeCounts: DEFAULT_SKILL_PRACTICE_COUNTS, dailySkillPractice: {}, dailySkillMastery: {}, wordMatchRecords: {}, wordMatchHistory: [], bossCompletedLevelIds: [], claimedMilestones: [], celebratedLevelIds: [], completedReadingIds: [], readingHistory: [], reviewSchedule: {}, dialoguePronunciationAttempts: [], grammarMistakes: {}, completedWordMatchRoundIds: [], claimedBadgeCollectionMilestones: [], wordMatchTimedBestSeconds: {}, bossCompletedAt: {}, claimedBadgeCollectionAt: {}, rareBadgeUnlockedAt: {}, lessonBestAccuracy: {}, lessonBestStars: {}, materialBatchBadges: {}, completedMicroStoryIds: [], moduleActivity: emptyModuleActivity(), recentLearning: null };
export const dateKey = localDateKey;
const copyDefaultProgress = (): LearningProgress => ({ ...DEFAULT_PROGRESS, completedLessonIds: [], reviewWordIds: [], dailyRecords: {}, pronunciationAttempts: [], skillPracticeCounts: { ...DEFAULT_SKILL_PRACTICE_COUNTS }, dailySkillPractice: {}, dailySkillMastery: {}, wordMatchRecords: {}, wordMatchHistory: [], bossCompletedLevelIds: [], claimedMilestones: [], celebratedLevelIds: [], completedReadingIds: [], readingHistory: [], reviewSchedule: {}, dialoguePronunciationAttempts: [], grammarMistakes: {}, completedWordMatchRoundIds: [], claimedBadgeCollectionMilestones: [], wordMatchTimedBestSeconds: {}, bossCompletedAt: {}, claimedBadgeCollectionAt: {}, rareBadgeUnlockedAt: {}, lessonBestAccuracy: {}, lessonBestStars: {}, materialBatchBadges: {}, completedMicroStoryIds: [], moduleActivity: emptyModuleActivity(), recentLearning: null });
const normalizeProgress = (progress: Partial<LearningProgress> | undefined): LearningProgress => ({ ...copyDefaultProgress(), ...progress, completedLessonIds: progress?.completedLessonIds ?? [], reviewWordIds: progress?.reviewWordIds ?? [], dailyRecords: progress?.dailyRecords ?? {}, pronunciationAttempts: progress?.pronunciationAttempts ?? [], skillPracticeCounts: { ...DEFAULT_SKILL_PRACTICE_COUNTS, ...(progress?.skillPracticeCounts ?? {}) }, dailySkillPractice: progress?.dailySkillPractice ?? {}, dailySkillMastery: progress?.dailySkillMastery ?? {}, wordMatchRecords: progress?.wordMatchRecords ?? {}, wordMatchHistory: progress?.wordMatchHistory ?? [], bossCompletedLevelIds: progress?.bossCompletedLevelIds ?? [], claimedMilestones: progress?.claimedMilestones ?? [], celebratedLevelIds: progress?.celebratedLevelIds ?? [], completedReadingIds: progress?.completedReadingIds ?? [], readingHistory: progress?.readingHistory ?? [], reviewSchedule: progress?.reviewSchedule ?? {}, dialoguePronunciationAttempts: progress?.dialoguePronunciationAttempts ?? [], grammarMistakes: progress?.grammarMistakes ?? {}, completedWordMatchRoundIds: progress?.completedWordMatchRoundIds ?? [], claimedBadgeCollectionMilestones: progress?.claimedBadgeCollectionMilestones ?? [], wordMatchTimedBestSeconds: progress?.wordMatchTimedBestSeconds ?? {}, bossCompletedAt: progress?.bossCompletedAt ?? {}, claimedBadgeCollectionAt: progress?.claimedBadgeCollectionAt ?? {}, rareBadgeUnlockedAt: progress?.rareBadgeUnlockedAt ?? {}, lessonBestAccuracy: progress?.lessonBestAccuracy ?? {}, lessonBestStars: progress?.lessonBestStars ?? {}, materialBatchBadges: progress?.materialBatchBadges ?? {}, completedMicroStoryIds: progress?.completedMicroStoryIds ?? [], moduleActivity: { ...emptyModuleActivity(), ...(progress?.moduleActivity ?? {}) }, recentLearning: progress?.recentLearning ?? null });
const defaultFamily = (): FamilyState => ({ activeProfileId: "child-1", profiles: [{ id: "child-1", name: "小兔同学", avatar: "🐇", createdAt: dateKey(), progress: copyDefaultProgress() }] });

export const loadFamilyState = async (): Promise<FamilyState> => {
  const raw = await AsyncStorage.getItem(FAMILY_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as FamilyState;
      if (parsed.profiles?.length) {
        const profiles = parsed.profiles.map((profile) => ({ ...profile, progress: normalizeProgress(profile.progress) }));
        return { activeProfileId: profiles.some((profile) => profile.id === parsed.activeProfileId) ? parsed.activeProfileId : profiles[0].id, profiles };
      }
    } catch { /* migrate safely */ }
  }
  const family = defaultFamily();
  const legacy = await AsyncStorage.getItem(LEGACY_PROGRESS_KEY);
  if (legacy) { try { family.profiles[0].progress = normalizeProgress(JSON.parse(legacy)); } catch { /* retain defaults */ } }
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family));
  return family;
};
export const saveFamilyState = async (family: FamilyState) => { await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family)); return family; };
export const getActiveProfile = async (): Promise<ChildProfile> => { const family = await loadFamilyState(); return family.profiles.find((profile) => profile.id === family.activeProfileId) ?? family.profiles[0]; };
export const setActiveProfile = async (profileId: string) => { const family = await loadFamilyState(); return family.profiles.some((profile) => profile.id === profileId) ? saveFamilyState({ ...family, activeProfileId: profileId }) : family; };
export const createChildProfile = async (name: string, avatar: string) => { const family = await loadFamilyState(); const profile: ChildProfile = { id: `child-${Date.now()}`, name: name.trim().slice(0, 16) || "新学习者", avatar, createdAt: dateKey(), progress: copyDefaultProgress() }; return saveFamilyState({ activeProfileId: profile.id, profiles: [...family.profiles, profile] }); };
export const loadProgress = async (): Promise<LearningProgress> => (await getActiveProfile()).progress;
export const saveProgress = async (progress: LearningProgress) => { const family = await loadFamilyState(); await saveFamilyState({ ...family, profiles: family.profiles.map((profile) => profile.id === family.activeProfileId ? { ...profile, progress: normalizeProgress(progress) } : profile) }); return progress; };

export const updateLessonBestPerformance = ({ bestAccuracy, bestStars, lessonId, correctAnswers, totalAnswers, earnedStars }: { bestAccuracy: Record<string, number>; bestStars: Record<string, number>; lessonId: string; correctAnswers: number; totalAnswers: number; earnedStars: number }) => {
  const accuracy = totalAnswers <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((correctAnswers / totalAnswers) * 100)));
  const stars = Math.max(0, Math.min(3, Math.round(earnedStars)));
  return { accuracy, stars, bestAccuracy: { ...bestAccuracy, [lessonId]: Math.max(bestAccuracy[lessonId] ?? 0, accuracy) }, bestStars: { ...bestStars, [lessonId]: Math.max(bestStars[lessonId] ?? 0, stars) } };
};

export const recordLessonResult = async ({ lessonId, earnedStars, incorrectWordIds, correctAnswers, totalAnswers, minutesStudied, skillPracticeCounts = {}, skillMastery = {} }: { lessonId: string; earnedStars: number; incorrectWordIds: string[]; correctAnswers: number; totalAnswers: number; minutesStudied: number; skillPracticeCounts?: Partial<Record<LessonSkill, number>>; skillMastery?: Partial<Record<LessonSkill, { correct: number; total: number }>> }) => {
  const progress = await loadProgress(); const today = dateKey(); const streakDelta = calculateNextStreak(progress.lastStudyDate, today); const isNewLesson = !progress.completedLessonIds.includes(lessonId); const currentDay = { ...EMPTY_DAY_RECORD, ...(progress.dailyRecords[today] ?? {}) };
  const performance = updateLessonBestPerformance({ bestAccuracy: progress.lessonBestAccuracy, bestStars: progress.lessonBestStars, lessonId, correctAnswers, totalAnswers, earnedStars });
  const updatedSkillCounts = (Object.keys(DEFAULT_SKILL_PRACTICE_COUNTS) as LessonSkill[]).reduce((counts, skill) => ({ ...counts, [skill]: counts[skill] + (skillPracticeCounts[skill] ?? 0) }), { ...progress.skillPracticeCounts });
  const currentSkills = progress.dailySkillPractice[today] ?? {};
  const dailySkills = (Object.keys(DEFAULT_SKILL_PRACTICE_COUNTS) as LessonSkill[]).reduce((counts, skill) => ({ ...counts, [skill]: (counts[skill] ?? 0) + (skillPracticeCounts[skill] ?? 0) }), currentSkills);
  const currentMastery = progress.dailySkillMastery[today] ?? {};
  const dailyMastery = (Object.keys(skillMastery) as LessonSkill[]).reduce((result, skill) => { const existing = result[skill] ?? { correct: 0, total: 0 }; const next = skillMastery[skill] ?? { correct: 0, total: 0 }; return { ...result, [skill]: { correct: existing.correct + next.correct, total: existing.total + next.total } }; }, { ...currentMastery });
  return saveProgress({ completedLessonIds: isNewLesson ? [...progress.completedLessonIds, lessonId] : progress.completedLessonIds, totalStars: progress.totalStars + (isNewLesson ? earnedStars : 0), streak: streakDelta === null ? progress.streak : streakDelta === 0 ? 1 : progress.streak + 1, lastStudyDate: today, reviewWordIds: Array.from(new Set([...progress.reviewWordIds, ...incorrectWordIds])), dailyGoalLessons: progress.dailyGoalLessons ?? 2, dailyRecords: { ...progress.dailyRecords, [today]: { lessons: currentDay.lessons + 1, correctAnswers: currentDay.correctAnswers + correctAnswers, totalAnswers: currentDay.totalAnswers + totalAnswers, minutes: currentDay.minutes + minutesStudied } }, pronunciationAttempts: progress.pronunciationAttempts, skillPracticeCounts: updatedSkillCounts, dailySkillPractice: { ...progress.dailySkillPractice, [today]: dailySkills }, dailySkillMastery: { ...progress.dailySkillMastery, [today]: dailyMastery }, wordMatchRecords: progress.wordMatchRecords, wordMatchHistory: progress.wordMatchHistory, bossCompletedLevelIds: progress.bossCompletedLevelIds, claimedMilestones: progress.claimedMilestones, celebratedLevelIds: progress.celebratedLevelIds, completedReadingIds: progress.completedReadingIds, readingHistory: progress.readingHistory, reviewSchedule: incorrectWordIds.reduce((schedule, wordId) => scheduleWrongAnswer(schedule, wordId, today), progress.reviewSchedule), dialoguePronunciationAttempts: progress.dialoguePronunciationAttempts, grammarMistakes: progress.grammarMistakes, completedWordMatchRoundIds: progress.completedWordMatchRoundIds, claimedBadgeCollectionMilestones: progress.claimedBadgeCollectionMilestones, wordMatchTimedBestSeconds: progress.wordMatchTimedBestSeconds, bossCompletedAt: progress.bossCompletedAt, claimedBadgeCollectionAt: progress.claimedBadgeCollectionAt, rareBadgeUnlockedAt: progress.rareBadgeUnlockedAt, lessonBestAccuracy: performance.bestAccuracy, lessonBestStars: performance.bestStars, materialBatchBadges: progress.materialBatchBadges, completedMicroStoryIds: progress.completedMicroStoryIds, moduleActivity: progress.moduleActivity, recentLearning: { kind: "lesson", lessonId, updatedAt: Date.now() } });
};
export const clearReviewWord = async (wordId: string) => { const progress = await loadProgress(); return saveProgress({ ...progress, reviewWordIds: progress.reviewWordIds.filter((id) => id !== wordId) }); };
/** 仅移除首页“继续上次学习”卡片，不会修改课程成绩、徽章、星星或复习计划。 */
export const clearRecentLearning = async () => { const progress = await loadProgress(); return saveProgress({ ...progress, recentLearning: null }); };
export const applyLearningMistake = (progress: LearningProgress, wordId: string, date = dateKey()) => {
  const normalizedWordId = wordId.trim().toLowerCase();
  if (!normalizedWordId) return progress;
  return {
    ...progress,
    reviewWordIds: Array.from(new Set([...progress.reviewWordIds, normalizedWordId])),
    reviewSchedule: scheduleWrongAnswer(progress.reviewSchedule, normalizedWordId, date),
  };
};
export const recordLearningMistake = async (wordId: string) => {
  const progress = await loadProgress();
  return saveProgress(applyLearningMistake(progress, wordId));
};
export const getDueReviewWordIds = async () => { const progress = await loadProgress(); return dueReviewIds(progress.reviewSchedule, dateKey()); };
export const recordReviewSuccess = async (wordId: string) => { const progress = await loadProgress(); return saveProgress({ ...progress, reviewSchedule: scheduleReviewSuccess(progress.reviewSchedule, wordId, dateKey()) }); };
export const recordPronunciationScore = async (score: number) => { const progress = await loadProgress(); return saveProgress({ ...progress, pronunciationAttempts: [...progress.pronunciationAttempts, { date: dateKey(), score: Math.max(0, Math.min(100, Math.round(score))) }].slice(-50) }); };
export const recordDialoguePronunciation = async (dialogueId: string, score: number, stars: number) => { const progress = await loadProgress(); const safeScore = Math.max(0, Math.min(100, Math.round(score))); const safeStars = Math.max(0, Math.min(3, Math.round(stars))); const attempts = [...progress.dialoguePronunciationAttempts, { dialogueId, date: dateKey(), score: safeScore, stars: safeStars }].slice(-100); const earnedSpeechBadge = attempts.reduce((sum, item) => sum + item.stars, 0) >= 10; return saveProgress({ ...progress, totalStars: progress.totalStars + safeStars, pronunciationAttempts: [...progress.pronunciationAttempts, { date: dateKey(), score: safeScore }].slice(-50), dialoguePronunciationAttempts: attempts, rareBadgeUnlockedAt: earnedSpeechBadge && !progress.rareBadgeUnlockedAt["speech-star"] ? { ...progress.rareBadgeUnlockedAt, "speech-star": dateKey() } : progress.rareBadgeUnlockedAt }); };
export const recordSkillPractice = async (skill: LessonSkill) => { const progress = await loadProgress(); const today = dateKey(); const daily = progress.dailySkillPractice[today] ?? {}; return saveProgress({ ...progress, skillPracticeCounts: { ...progress.skillPracticeCounts, [skill]: progress.skillPracticeCounts[skill] + 1 }, dailySkillPractice: { ...progress.dailySkillPractice, [today]: { ...daily, [skill]: (daily[skill] ?? 0) + 1 } } }); };
export const applyModuleActivity = (progress: LearningProgress, module: LearningActivityModule, activity: { correct?: boolean; completed?: number }) => {
  const current = progress.moduleActivity[module] ?? { attempts: 0, correct: 0, completed: 0 };
  const attempted = typeof activity.correct === "boolean";
  return { ...progress, moduleActivity: { ...progress.moduleActivity, [module]: { attempts: current.attempts + (attempted ? 1 : 0), correct: current.correct + (activity.correct ? 1 : 0), completed: current.completed + (activity.completed ?? 0) } } };
};
export const recordModuleActivity = async (module: LearningActivityModule, activity: { correct?: boolean; completed?: number }) => saveProgress(applyModuleActivity(await loadProgress(), module, activity));
export const recordMaterialBatchCompletion = async (levelId: string, batchIndex: number) => { const progress = await loadProgress(); const badge = getMaterialBatchBadge(levelId, batchIndex); const alreadyEarned = Boolean(progress.materialBatchBadges[badge.id]); const updated = await saveProgress({ ...progress, materialBatchBadges: alreadyEarned ? progress.materialBatchBadges : { ...progress.materialBatchBadges, [badge.id]: { earnedAt: dateKey(), stars: badge.stars } }, totalStars: progress.totalStars + (alreadyEarned ? 0 : badge.stars), recentLearning: { kind: "material", levelId, batchIndex, updatedAt: Date.now() } }); return { progress: updated, badge, isNew: !alreadyEarned }; };
export const recordMicroStoryCompletion = async (storyId: string) => { const progress = await loadProgress(); const isNew = !progress.completedMicroStoryIds.includes(storyId); const withActivity = applyModuleActivity(progress, "micro-story", { completed: 1 }); const updated = await saveProgress({ ...withActivity, completedMicroStoryIds: isNew ? [...progress.completedMicroStoryIds, storyId] : progress.completedMicroStoryIds, totalStars: progress.totalStars + (isNew ? 1 : 0), recentLearning: { kind: "micro-story", levelId: storyId, updatedAt: Date.now() } }); return { progress: updated, isNew, reward: isNew ? 1 : 0 }; };
export const recordStoryClozeMistake = recordLearningMistake;
export const recordGrammarResult = async (questionId: string, correct: boolean) => { const progress = await loadProgress(); return saveProgress({ ...progress, grammarMistakes: applyGrammarResult(progress.grammarMistakes, questionId, correct, dateKey()) }); };
export const clearGrammarMistakes = async () => { const progress = await loadProgress(); return saveProgress({ ...progress, grammarMistakes: {} }); };
export const getGrammarMistakeIds = async () => orderedGrammarMistakeIds((await loadProgress()).grammarMistakes);
export const recordReadingCompletion = async (readingId: string) => { const progress = await loadProgress(); const today = dateKey(); const existingToday = progress.readingHistory.some((item) => item.readingId === readingId && item.date === today); const isNew = !progress.completedReadingIds.includes(readingId); const withActivity = isNew ? applyModuleActivity(progress, "reading", { completed: 1 }) : progress; return saveProgress({ ...withActivity, completedReadingIds: Array.from(new Set([...progress.completedReadingIds, readingId])), readingHistory: existingToday ? progress.readingHistory : [...progress.readingHistory, { readingId, date: today }].slice(-120), recentLearning: { kind: "reading", readingId, updatedAt: Date.now() } }); };
export const recordDialogueCompletion = async () => { const progress = await loadProgress(); return saveProgress({ ...applyModuleActivity(progress, "dialogue", { completed: 1 }), recentLearning: { kind: "dialogue", updatedAt: Date.now() } }); };
export const recordWordMatchResult = async (wordId: string, correct: boolean) => {
  const progress = await loadProgress();
  const today = dateKey();
  const current = progress.wordMatchRecords[wordId] ?? { correct: 0, total: 0, lastPracticed: today };
  const withMistake = correct ? progress : applyLearningMistake(progress, wordId, today);
  return saveProgress({ ...withMistake, wordMatchRecords: { ...progress.wordMatchRecords, [wordId]: { correct: current.correct + (correct ? 1 : 0), total: current.total + 1, lastPracticed: today } }, wordMatchHistory: [...progress.wordMatchHistory, { wordId, correct, date: today }].slice(-240) });
};
export const recordWordMatchRoundCompletion = async (roundId: string) => { const progress = await loadProgress(); const completed = Array.from(new Set([...progress.completedWordMatchRoundIds, roundId])); const themeIds = ["fruit", "animals", "traffic", "weather"]; const earnedPictureBadge = themeIds.every((id) => completed.includes(id)); return saveProgress({ ...progress, completedWordMatchRoundIds: completed, rareBadgeUnlockedAt: earnedPictureBadge && !progress.rareBadgeUnlockedAt["picture-collector"] ? { ...progress.rareBadgeUnlockedAt, "picture-collector": dateKey() } : progress.rareBadgeUnlockedAt }); };
export const recordTimedWordMatchResult = async (roundId: string, seconds: number) => { const progress = await loadProgress(); const safeSeconds = Math.max(0, Math.ceil(seconds)); const previous = progress.wordMatchTimedBestSeconds[roundId]; const newBest = isNewBestTime(previous, safeSeconds); const bonus = getTimedWordMatchBonus(safeSeconds); return saveProgress({ ...progress, wordMatchTimedBestSeconds: newBest ? { ...progress.wordMatchTimedBestSeconds, [roundId]: safeSeconds } : progress.wordMatchTimedBestSeconds, totalStars: progress.totalStars + bonus }).then((updated) => ({ progress: updated, bonus, newBest })); };
export const claimBadgeCollectionMilestone = async (milestone: number, reward: number) => { const progress = await loadProgress(); if (progress.bossCompletedLevelIds.length < milestone || progress.claimedBadgeCollectionMilestones.includes(milestone)) return progress; const today = dateKey(); return saveProgress({ ...progress, claimedBadgeCollectionMilestones: [...progress.claimedBadgeCollectionMilestones, milestone], claimedBadgeCollectionAt: { ...progress.claimedBadgeCollectionAt, [String(milestone)]: today }, totalStars: progress.totalStars + reward }); };
export const recordBossCompletion = async (levelId: string, bonusStars = 5) => { const progress = await loadProgress(); const isNew = !progress.bossCompletedLevelIds.includes(levelId); const today = dateKey(); const completed = isNew ? [...progress.bossCompletedLevelIds, levelId] : progress.bossCompletedLevelIds; return saveProgress({ ...progress, bossCompletedLevelIds: completed, bossCompletedAt: isNew ? { ...progress.bossCompletedAt, [levelId]: today } : progress.bossCompletedAt, rareBadgeUnlockedAt: completed.length >= 7 && !progress.rareBadgeUnlockedAt["seven-stars"] ? { ...progress.rareBadgeUnlockedAt, "seven-stars": today } : progress.rareBadgeUnlockedAt, totalStars: progress.totalStars + (isNew ? bonusStars : 0) }); };
export const claimStreakMilestone = async (days: number) => { const progress = await loadProgress(); if (progress.streak < days || progress.claimedMilestones.includes(days)) return progress; return saveProgress({ ...progress, claimedMilestones: [...progress.claimedMilestones, days], totalStars: progress.totalStars + Math.max(1, Math.round(days / 3)) }); };
export const markLevelCelebrated = async (levelId: string) => { const progress = await loadProgress(); if (progress.celebratedLevelIds.includes(levelId)) return progress; return saveProgress({ ...progress, celebratedLevelIds: [...progress.celebratedLevelIds, levelId] }); };
