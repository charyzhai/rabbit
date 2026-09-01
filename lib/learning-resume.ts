import { DAILY_READINGS } from "./grade-content";
import { LESSONS } from "./learning-data";
import type { LearningProgress } from "./learning-progress";

export type LearningResume = { title: string; detail: string; icon: string; path: string; params?: Record<string, string> };

/** 将最近一次实际完成的本地学习记录转换为可安全恢复的页面路由。 */
export const getRecentLearningResume = (progress: LearningProgress): LearningResume | null => {
  const recent = progress.recentLearning;
  if (!recent) return null;
  if (recent.kind === "lesson") {
    const lesson = LESSONS.find((item) => item.id === recent.lessonId);
    return lesson ? { title: lesson.title, detail: `${lesson.scene} · 再练一次巩固本领`, icon: "🗺️", path: "/lesson/[id]", params: { id: lesson.id } } : null;
  }
  if (recent.kind === "reading") {
    const reading = DAILY_READINGS.find((item) => item.id === recent.readingId);
    return reading ? { title: reading.title, detail: "每日一读 · 继续听读与理解", icon: "📖", path: "/reading" } : null;
  }
  if (recent.kind === "material") return { title: `${recent.levelId} 新增词第 ${recent.batchIndex + 1} 组`, detail: "继续词义、听辨、语境和跟读挑战", icon: "🥕", path: "/material-practice/[level]", params: { level: recent.levelId, batch: String(recent.batchIndex) } };
  if (recent.kind === "micro-story") return { title: `${recent.levelId} 兔兔微故事`, detail: "继续听读、填空与跟读三步挑战", icon: "📖", path: "/micro-story-challenge/[level]", params: { level: recent.levelId } };
  return { title: "角色对话小剧场", detail: "继续按单元句型练习开口交流", icon: "💬", path: "/dialogue" };
};
