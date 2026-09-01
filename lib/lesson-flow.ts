export const isLessonRevisitable = (lessonId: string, completedLessonIds: string[], nextLessonId: string) => completedLessonIds.includes(lessonId) || lessonId === nextLessonId;

export const answerCounterLabel = (correctCount: number, totalCount: number) => `答对 ${Math.max(0, Math.min(correctCount, totalCount))}/${totalCount}`;

export const getLessonPerformanceLabel = (accuracy: number | undefined) => accuracy === undefined ? "" : `最佳 ${Math.max(0, Math.min(100, Math.round(accuracy)))}%`;

export const needsReview = (accuracy: number | undefined) => accuracy !== undefined && accuracy < 80;
