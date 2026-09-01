import { getGradeBestAccuracySummaries } from "./learning-insights";
import { LESSONS, REVIEW_WORDS } from "./learning-data";
import { BUNNY_MICRO_STORIES } from "./material-learning";
import type { ChildProfile, LearningProgress } from "./learning-progress";

const safeCell = (value: string | number) => String(value).replace(/[|\n\r]/g, " ").trim();
const safeFilenamePart = (value: string) => value.replace(/[\\/:*?"<>|\n\r]/g, "_").trim();
const percent = (correct: number, total: number) => total ? Math.round((correct / total) * 100) : 0;
const starText = (stars: number) => "⭐".repeat(Math.max(0, Math.min(3, stars))) || "—";

export const formatLearningArchiveMarkdown = (profile: ChildProfile, generatedAt: string) => {
  const progress = profile.progress;
  const records = Object.values(progress.dailyRecords);
  const totals = records.reduce((result, record) => ({ lessons: result.lessons + record.lessons, correct: result.correct + record.correctAnswers, answers: result.answers + record.totalAnswers, minutes: result.minutes + record.minutes }), { lessons: 0, correct: 0, answers: 0, minutes: 0 });
  const gradeRows = getGradeBestAccuracySummaries(progress).map((item) => `| ${safeCell(item.grade)} | ${item.averageBestAccuracy === null ? "暂无" : `${item.averageBestAccuracy}%`} | ${item.recordedLessons}/${item.totalLessons} | ${item.needsConsolidation ? "建议巩固" : item.recordedLessons ? "进展稳定" : "等待学习"} |`);
  const lessonRows = Object.entries(progress.lessonBestAccuracy).sort(([left], [right]) => left.localeCompare(right)).map(([lessonId, accuracy]) => { const lesson = LESSONS.find((item) => item.id === lessonId); return `| ${safeCell(lesson?.title ?? lessonId)} | ${accuracy}% | ${starText(progress.lessonBestStars[lessonId] ?? 0)} |`; });
  const reviewNames = progress.reviewWordIds.map((wordId) => REVIEW_WORDS.find((item) => item.id === wordId)?.word ?? wordId).filter(Boolean);
  const materialBadges = Object.keys(progress.materialBatchBadges).length;
  const rareBadges = Object.keys(progress.rareBadgeUnlockedAt).length;
  const advice = reviewNames.length ? `建议优先复习：${reviewNames.slice(0, 8).join("、")}${reviewNames.length > 8 ? "等" : ""}。` : totals.lessons ? "当前没有待复习词，可保持每天1—2个短关卡，并继续完成微故事挑战。" : "建议从G1第一关开始，每天安排约4分钟的短关卡。";

  return [
    "# 兔兔英语闯关 · 学习档案",
    "",
    `> 学习者：${safeCell(profile.name)}  `,
    `> 生成日期：${safeCell(generatedAt)}  `,
    "> 数据来源：当前设备本地学习记录，不包含录音原文件或家长PIN。",
    "",
    "## 一、学习总览",
    "",
    "| 指标 | 记录 |",
    "| --- | ---: |",
    `| 累计完成主题关 | ${progress.completedLessonIds.length} 关 |`,
    `| 累计答题正确率 | ${percent(totals.correct, totals.answers)}% |`,
    `| 累计学习时长 | ${totals.minutes} 分钟 |`,
    `| 当前连续学习 | ${progress.streak} 天 |`,
    `| 累计星星 | ${progress.totalStars} 颗 |`,
    `| 待复习词汇 | ${progress.reviewWordIds.length} 个 |`,
    "",
    "## 二、按年级的最佳正确率",
    "",
    "| 年级 | 平均最佳正确率 | 已统计主题关 | 状态 |",
    "| --- | ---: | ---: | --- |",
    ...gradeRows,
    "",
    "## 三、已记录的主题关最佳成绩",
    "",
    lessonRows.length ? ["| 主题关 | 最佳正确率 | 最高星级 |", "| --- | ---: | --- |", ...lessonRows].join("\n") : "暂无主题关结算记录。完成一次主题关后，此处会自动显示最佳正确率和星级。",
    "",
    "## 四、互动成就与挑战",
    "",
    "| 项目 | 记录 |",
    "| --- | ---: |",
    `| BOSS等级星徽 | ${progress.bossCompletedLevelIds.length}/7 |`,
    `| 稀有徽章 | ${rareBadges} 枚 |`,
    `| 12词短练习小徽章 | ${materialBadges} 枚 |`,
    `| 兔兔微故事挑战 | ${progress.completedMicroStoryIds.length}/${BUNNY_MICRO_STORIES.length} 篇 |`,
    `| 词图连线主题 | ${progress.completedWordMatchRoundIds.length} 个 |`,
    "",
    "## 五、待复习词汇",
    "",
    reviewNames.length ? reviewNames.map((word, index) => `${index + 1}. ${safeCell(word)}`).join("\n") : "当前没有待复习词。继续保持练习节奏！",
    "",
    "## 六、家长陪学建议",
    "",
    advice,
    "",
    "---",
    "本学习档案由兔兔英语闯关在当前设备本地生成。",
  ].join("\n");
};

export const getLearningArchiveFilename = (profileName: string, generatedAt: string) => `兔兔英语_${safeFilenamePart(profileName) || "学习者"}_学习档案_${safeFilenamePart(generatedAt)}.md`;

export const getArchiveProgressOverview = (progress: LearningProgress) => ({ materialBadgeCount: Object.keys(progress.materialBatchBadges).length, microStoryCount: progress.completedMicroStoryIds.length });
