import type { LearningProgress } from "./learning-progress";

export const BADGE_COLLECTION_MILESTONES = [3, 6, 7] as const;
const THEME_PACK_IDS = ["fruit", "animals", "traffic", "weather"];

export type RareBadge = { id: string; icon: string; name: string; hint: string; progress: number; goal: number; unlocked: boolean };

export const getRareBadges = (progress: LearningProgress): RareBadge[] => {
  const allBosses = progress.bossCompletedLevelIds.length;
  const themedPacks = progress.completedWordMatchRoundIds.filter((id) => THEME_PACK_IDS.includes(id)).length;
  const dialogueStars = progress.dialoguePronunciationAttempts.reduce((sum, item) => sum + item.stars, 0);
  return [
    { id: "seven-stars", icon: "🌟", name: "七星探险家", hint: "完成全部7个等级BOSS", progress: allBosses, goal: 7, unlocked: allBosses >= 7 },
    { id: "picture-collector", icon: "🧩", name: "词图收藏家", hint: "完成水果、动物、交通、天气4个主题包", progress: themedPacks, goal: 4, unlocked: themedPacks >= 4 },
    { id: "speech-star", icon: "🎙️", name: "朗读小明星", hint: "在角色对话中累计获得10颗发音星", progress: dialogueStars, goal: 10, unlocked: dialogueStars >= 10 },
  ];
};

export const getBadgeCollectionState = (progress: LearningProgress) => {
  const coreCompleted = progress.bossCompletedLevelIds.length;
  const nextMilestone = BADGE_COLLECTION_MILESTONES.find((value) => coreCompleted >= value && !progress.claimedBadgeCollectionMilestones.includes(value)) ?? null;
  const rareBadges = getRareBadges(progress);
  return { coreCompleted, coreTotal: 7, rareBadges, nextMilestone, collectedTotal: coreCompleted + rareBadges.filter((item) => item.unlocked).length };
};

export const getBadgeMilestoneReward = (milestone: number) => milestone === 7 ? 7 : milestone === 6 ? 4 : 2;
