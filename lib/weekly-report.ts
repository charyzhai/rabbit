import type { ChildProfile } from "./learning-progress";

export type WeeklyReportSummary = {
  lessons: number;
  minutes: number;
  accuracy: number;
  speakingCount: number;
  pronunciationAverage: number;
};

export const formatWeeklyReport = (profile: ChildProfile, summary: WeeklyReportSummary, endDate: string) => {
  const progress = profile.progress;
  const practiceLine = summary.speakingCount ? `朗读评分：完成 ${summary.speakingCount} 次，平均 ${summary.pronunciationAverage} 分。` : "朗读评分：本周尚未完成录音评分练习。";
  const advice = progress.reviewWordIds.length ? `建议：优先复习 ${progress.reviewWordIds.length} 个待巩固词汇，再安排新关卡。` : summary.lessons ? "建议：保持每天1—2个短关卡，并继续朗读本周词汇。" : "建议：从L1第一关开始，每天安排约4分钟的短关卡。";
  return ["兔兔英语闯关 · 家长周报", `学习者：${profile.name}`, `统计截止：${endDate}`, "", `本周完成关卡：${summary.lessons} 个`, `本周学习时长：${summary.minutes} 分钟`, `答题正确率：${summary.accuracy}%`, practiceLine, `当前连续学习：${progress.streak} 天`, `待复习词汇：${progress.reviewWordIds.length} 个`, "", advice, "", "说明：本周报由当前设备本地学习数据生成。"].join("\n");
};
