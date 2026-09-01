export const dayDifference = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
};

export const calculateNextStreak = (lastStudyDate: string | null, currentDate: string) => {
  if (!lastStudyDate) return 1;
  const difference = dayDifference(lastStudyDate, currentDate);
  if (difference === 0) return null;
  return difference === 1 ? 1 : 0;
};

export const isLevelUnlocked = (levelIndex: number, completedCount: number, lessonsPerLevel = 8) => levelIndex === 0 || completedCount >= levelIndex * lessonsPerLevel;
