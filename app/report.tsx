import { useCallback, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { RabbitAvatar } from "@/components/rabbit-avatar";
import { LineChart } from "@/components/line-chart";
import { getParentSummary, getWeeklySummary } from "@/lib/learning-analytics";
import { getGoalAdjustment, getGradeBestAccuracySummaries, getModuleActivitySummary, getParentSkillTrends, getWeakWords, getWeekComparison } from "@/lib/learning-insights";
import { REVIEW_WORDS } from "@/lib/learning-data";
import { type ChildProfile, DEFAULT_PROGRESS, dateKey, getActiveProfile, type LearningProgress, loadProgress } from "@/lib/learning-progress";
import { formatWeeklyReport } from "@/lib/weekly-report";
import { formatLearningArchiveMarkdown, getLearningArchiveFilename } from "@/lib/learning-archive";
import { isParentSessionUnlocked } from "@/lib/parent-security";
import { ScreenContainer } from "@/components/screen-container";
import { LoadingState } from "@/components/loading-state";
import { TransitionIn } from "@/components/transition-in";

export default function ParentReportScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState<"weekly" | "archive" | null>(null);

  useFocusEffect(useCallback(() => { let active = true; setIsLoading(true); void isParentSessionUnlocked().then(async (unlocked) => { if (!unlocked) { router.replace({ pathname: "/parent-gate", params: { target: "report" } } as never); return; } const [nextProgress, nextProfile] = await Promise.all([loadProgress(), getActiveProfile()]); if (active) { setProgress(nextProgress); setProfile(nextProfile); } }).finally(() => { if (active) setIsLoading(false); }); return () => { active = false; }; }, [router]));

  const summary = getParentSummary(progress, dateKey());
  const weekly = getWeeklySummary(progress, dateKey());
  const skillTrends = getParentSkillTrends(progress, dateKey());
  const gradePerformance = getGradeBestAccuracySummaries(progress);
  const weakWords = getWeakWords(progress, REVIEW_WORDS, 3);
  const weekComparison = getWeekComparison(progress, dateKey());
  const goalAdvice = getGoalAdjustment(progress, dateKey());
  const moduleActivity = getModuleActivitySummary(progress);
  const suggestion = weakWords.length ? `建议先陪孩子复习“${weakWords.map((item) => item.word).join("、")}”等词，再进入新关卡。` : summary.reviewCount > 0 ? `建议优先复习 ${summary.reviewCount} 个待巩固词汇，再挑战新关卡。` : summary.totalLessons === 0 ? "建议从G1第一关开始，建立每天学习的习惯。" : summary.today.lessons === 0 ? "今天尚未学习，可安排一节约4分钟的短关卡。" : "今天已完成学习计划的一部分，鼓励孩子用英语朗读本课词汇。";
  const stats = [
    { value: `${summary.today.lessons}`, label: "今日完成关卡", accent: "#FFF0D7", color: "#B65B18" },
    { value: `${summary.todayAccuracy}%`, label: "今日正确率", accent: "#E7F6EB", color: "#2D8441" },
    { value: `${summary.totalMinutes} 分`, label: "主题关学习时长", accent: "#ECEBFF", color: "#5C58BA" },
    { value: `${summary.streak} 天`, label: "连续学习", accent: "#FCE8EF", color: "#AE3F67" },
  ];

  const exportWeeklyReport = async () => {
    if (!profile) return;
    setExporting("weekly");
    try { if (Platform.OS === "web") { Alert.alert("请在移动端导出", "周报文件导出和系统分享可在Android或iOS设备上使用。"); return; } const file = new File(Paths.cache, `兔兔英语_${profile.name}_周报_${dateKey()}.txt`); file.create({ overwrite: true, intermediates: true }); file.write(formatWeeklyReport(profile, weekly, dateKey())); if (!(await Sharing.isAvailableAsync())) { Alert.alert("当前设备不支持分享", "已生成周报文本，但系统分享不可用。"); return; } await Sharing.shareAsync(file.uri, { mimeType: "text/plain", dialogTitle: "分享本周学习报告" }); } finally { setExporting(null); }
  };

  const exportLearningArchive = async () => {
    if (!profile) return;
    setExporting("archive");
    try { const filename = getLearningArchiveFilename(profile.name, dateKey()); const markdown = formatLearningArchiveMarkdown({ ...profile, progress }, dateKey()); if (Platform.OS === "web") { const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); return; } const file = new File(Paths.cache, filename); file.create({ overwrite: true, intermediates: true }); file.write(markdown); if (!(await Sharing.isAvailableAsync())) { Alert.alert("当前设备不支持分享", "学习档案已生成，但无法打开系统分享面板。"); return; } await Sharing.shareAsync(file.uri, { mimeType: "text/markdown", dialogTitle: "导出学习档案" }); } finally { setExporting(null); }
  };

  const openGradeReview = (levelId: string, recordedLessons: number) => {
    if (!recordedLessons) { Alert.alert("暂时没有可筛选的关卡", "请先完成该年级的主题关，地图会记录每关最佳正确率，并自动筛选需要复练的关卡。"); return; }
    router.push({ pathname: "/(tabs)/map", params: { reviewLevelId: levelId, reviewOnly: "true" } } as never);
  };
  const delta = (value: number, suffix = "") => `${value > 0 ? "+" : ""}${value}${suffix}`;

  if (isLoading) return <ScreenContainer><LoadingState title="正在整理学习报告…" description="兔兔正在汇总本机的学习进度与趋势" /></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><TransitionIn trigger={profile?.id ?? "report"} style={styles.listWrap}>
    <FlatList
      data={skillTrends}
      keyExtractor={(item) => item.label}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        <View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="返回我的学习" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.navTitle}>家长学习报告</Text><View style={styles.topSpacer} /></View>
        <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.eyebrow}>{profile?.name ?? "当前学习者"} · 本地学习摘要</Text><Text style={styles.heroTitle}>看见每一次小进步</Text><Text style={styles.heroBody}>数据只保存在当前设备，方便家长陪伴学习。</Text></View><RabbitAvatar size={70} accent="#FFF0D7" /></View>
        <View style={styles.grid}>{stats.map((item) => <View key={item.label} style={[styles.stat, { backgroundColor: item.accent }]}><Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text><Text style={styles.statLabel}>{item.label}</Text></View>)}</View>
        <View style={styles.reportCard}><Text style={styles.cardTitle}>学习情况</Text><Text style={styles.cardText}>累计完成 {summary.totalLessons} 个主题关，整体答题正确率 {summary.allAccuracy}%，当前有 {summary.reviewCount} 个词汇可进入复习。</Text><View style={styles.moduleStats}><View style={styles.moduleStat}><Text style={styles.moduleValue}>{progress.skillPracticeCounts.grammar}</Text><Text style={styles.moduleLabel}>语法练习</Text></View><View style={styles.moduleStat}><Text style={styles.moduleValue}>{progress.completedReadingIds.length}</Text><Text style={styles.moduleLabel}>阅读点亮</Text></View><View style={styles.moduleStat}><Text style={styles.moduleValue}>{progress.skillPracticeCounts.listening + progress.skillPracticeCounts.speaking}</Text><Text style={styles.moduleLabel}>听读练习</Text></View></View></View>
        <View style={styles.activityCard}><Text style={styles.cardTitle}>扩展学习记录</Text><Text style={styles.activityHelp}>以下记录来自材料词、故事和对话，单独统计，不混入主题关时长。</Text><View style={styles.activityGrid}>{moduleActivity.map((item) => <View key={item.id} style={styles.activityItem}><Text style={styles.activityValue}>{item.completed}</Text><Text style={styles.activityLabel}>{item.label}</Text>{item.attempts ? <Text style={styles.activityHint}>答对 {item.correct}/{item.attempts}</Text> : null}</View>)}</View></View>
        <View style={styles.gradeSummaryCard}>
          <View style={styles.gradeSummaryHeader}><View><Text style={styles.cardTitle}>年级最佳正确率</Text><Text style={styles.gradeSummaryHelp}>轻点有记录的年级卡，可直接查看该年级正确率低于80%的主题关。</Text></View><Text style={styles.gradeSummaryIcon}>📊</Text></View>
          <View style={styles.gradeSummaryGrid}>{gradePerformance.map((item) => <Pressable key={item.levelId} accessibilityRole="button" accessibilityLabel={item.recordedLessons ? `${item.grade}平均最佳正确率${item.averageBestAccuracy ?? 0}%，查看低于80%的主题关` : `${item.grade}暂无单关成绩记录`} onPress={() => openGradeReview(item.levelId, item.recordedLessons)} style={({ pressed }) => [styles.gradeSummaryItem, item.needsConsolidation && styles.gradeSummaryReview, !item.recordedLessons && styles.gradeSummaryDisabled, pressed && Boolean(item.recordedLessons) && styles.pressed]}><View style={[styles.gradeBadge, { backgroundColor: item.color }]}><Text style={styles.gradeBadgeText}>{item.grade}</Text></View><View style={styles.gradeSummaryCopy}><Text style={[styles.gradeAverage, item.averageBestAccuracy === null && styles.gradeAverageMuted, item.needsConsolidation && styles.gradeAverageReview]}>{item.averageBestAccuracy === null ? "暂无" : `${item.averageBestAccuracy}%`}</Text><Text style={styles.gradeAverageLabel}>{item.averageBestAccuracy === null ? "尚无最佳成绩" : "平均最佳正确率"}</Text><Text style={[styles.gradeCoverage, item.needsConsolidation && styles.gradeCoverageReview]}>{item.recordedLessons}/{item.totalLessons} 关已统计{item.needsConsolidation ? " · 建议巩固" : ""}</Text><Text style={styles.gradeAction}>{item.recordedLessons ? "查看优先复练 →" : "完成关卡后开启"}</Text></View></Pressable>)}</View>
        </View>
        <View style={styles.trendHeader}><Text style={styles.cardTitle}>四项技能掌握趋势</Text><Text style={styles.trendHelp}>显示最近7天答对率；未练习的日期不会伪造数据。</Text></View>
      </>}
      renderItem={({ item }) => <View style={styles.skillCard}><View style={styles.skillHead}><Text style={[styles.skillName, { color: item.color }]}>{item.label}</Text><Text style={styles.skillHint}>最近7天掌握趋势</Text></View><LineChart points={item.values} color={item.color} /></View>}
      ListFooterComponent={<>
        <View style={styles.weekCard}><Text style={styles.cardTitle}>本周学习</Text><Text style={styles.cardText}>近7天完成 {weekly.lessons} 关 · {weekly.minutes} 分钟 · 正确率 {weekly.accuracy}%{weekly.speakingCount ? ` · 朗读 ${weekly.speakingCount} 次` : ""}</Text>{weekComparison.hasPreviousData ? <View style={styles.compareRow}><View style={styles.compareItem}><Text style={styles.compareValue}>{delta(weekComparison.lessonDelta, "关")}</Text><Text style={styles.compareLabel}>较上周关卡</Text></View><View style={styles.compareItem}><Text style={styles.compareValue}>{delta(weekComparison.minuteDelta, "分")}</Text><Text style={styles.compareLabel}>较上周时长</Text></View><View style={styles.compareItem}><Text style={styles.compareValue}>{delta(weekComparison.accuracyDelta, "%")}</Text><Text style={styles.compareLabel}>较上周正确率</Text></View></View> : <Text style={styles.noCompare}>上周暂无可比学习数据，完成本周后会自动生成周环比。</Text>}<View style={styles.exportRow}><Pressable accessibilityRole="button" accessibilityLabel="导出并分享家长周报" disabled={Boolean(exporting)} onPress={exportWeeklyReport} style={({ pressed }) => [styles.exportButton, Boolean(exporting) && styles.exportDisabled, pressed && styles.pressed]}><Text style={styles.exportText}>{exporting === "weekly" ? "正在生成…" : "导出周报"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="生成并导出Markdown学习档案" disabled={Boolean(exporting)} onPress={exportLearningArchive} style={({ pressed }) => [styles.archiveButton, Boolean(exporting) && styles.exportDisabled, pressed && styles.pressed]}><Text style={styles.archiveText}>{exporting === "archive" ? "正在生成…" : "导出学习档案 .md"}</Text></Pressable></View></View>
        <View style={styles.goalCard}><Text style={styles.cardTitle}>学习目标建议 · {goalAdvice.mode}</Text><Text style={styles.goalNumbers}>建议每天 {goalAdvice.goal} 关 · 每次约 {goalAdvice.minutes} 分钟</Text><Text style={styles.goalBody}>{goalAdvice.message}</Text><Pressable accessibilityRole="button" accessibilityLabel="前往学习中心调整每日目标" onPress={() => router.push("/(tabs)/profile" as never)} style={({ pressed }) => [styles.goalButton, pressed && styles.pressed]}><Text style={styles.goalButtonText}>前往学习中心查看目标</Text></Pressable></View>
        <View style={styles.suggestionCard}><Text style={styles.cardTitle}>陪学建议</Text><Text style={styles.suggestion}>{suggestion}</Text><Text style={styles.note}>趋势以每道题的正确数和练习数计算；跟读以完成挑战记录展示，朗读评分仅保留分数，不保存音频。</Text></View>
      </>}
    /></TransitionIn>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  listWrap: { flex: 1 }, content: { padding: 20, paddingBottom: 42, backgroundColor: "#FFF9F0", gap: 12 }, pressed: { opacity: 0.72 }, topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, navTitle: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, topSpacer: { width: 38 },
  hero: { borderRadius: 25, padding: 19, backgroundColor: "#FFF0D7", marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, heroCopy: { flex: 1, paddingRight: 12 }, eyebrow: { color: "#B65B18", fontSize: 12, fontWeight: "900" }, heroTitle: { color: "#553B23", fontSize: 22, fontWeight: "900", marginTop: 4 }, heroBody: { color: "#86694D", fontSize: 12, lineHeight: 18, marginTop: 7 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 }, stat: { width: "47.8%", minHeight: 100, borderRadius: 19, padding: 15, justifyContent: "space-between" }, statValue: { fontSize: 23, fontWeight: "900" }, statLabel: { color: "#675F57", fontSize: 12, fontWeight: "700", marginTop: 18 },
  reportCard: { backgroundColor: "#FFFFFF", borderRadius: 21, padding: 18, marginTop: 16, borderWidth: 1, borderColor: "#F0E8DE" }, cardTitle: { color: "#2E2A25", fontSize: 15, fontWeight: "900" }, cardText: { color: "#716960", fontSize: 13, lineHeight: 20, marginTop: 8 }, moduleStats: { flexDirection: "row", gap: 8, marginTop: 14 }, moduleStat: { flex: 1, padding: 10, borderRadius: 13, backgroundColor: "#FFF8EE" }, moduleValue: { color: "#A65B1B", fontSize: 18, fontWeight: "900" }, moduleLabel: { color: "#86694D", fontSize: 10, marginTop: 4, fontWeight: "800" },
  activityCard: { backgroundColor: "#FFFFFF", borderRadius: 21, padding: 18, marginTop: 12, borderWidth: 1, borderColor: "#F0E8DE" }, activityHelp: { color: "#716960", fontSize: 12, lineHeight: 18, marginTop: 6 }, activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 }, activityItem: { width: "48.5%", borderRadius: 13, padding: 10, backgroundColor: "#F6F3FF" }, activityValue: { color: "#5D58B5", fontSize: 18, fontWeight: "900" }, activityLabel: { color: "#635C79", fontSize: 11, marginTop: 3, fontWeight: "900" }, activityHint: { color: "#857D9B", fontSize: 10, marginTop: 3, fontWeight: "700" },
  gradeSummaryCard: { backgroundColor: "#FFFFFF", borderRadius: 21, padding: 18, marginTop: 12, borderWidth: 1, borderColor: "#F0E8DE" }, gradeSummaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, gradeSummaryHelp: { color: "#837A71", fontSize: 11, lineHeight: 17, marginTop: 5, maxWidth: 260 }, gradeSummaryIcon: { fontSize: 23, marginLeft: 8 }, gradeSummaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 14 }, gradeSummaryItem: { width: "48.5%", minHeight: 102, backgroundColor: "#FAF8F5", borderRadius: 15, padding: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F0E8DE" }, gradeSummaryReview: { backgroundColor: "#FFF7E9", borderColor: "#F5C56F" }, gradeSummaryDisabled: { opacity: 0.62 }, gradeBadge: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center", marginRight: 8 }, gradeBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, gradeSummaryCopy: { flex: 1 }, gradeAverage: { color: "#2D8441", fontSize: 18, fontWeight: "900" }, gradeAverageMuted: { color: "#8C857D", fontSize: 14 }, gradeAverageReview: { color: "#B86719" }, gradeAverageLabel: { color: "#70685F", fontSize: 9, marginTop: 1, fontWeight: "800" }, gradeCoverage: { color: "#82796F", fontSize: 9, marginTop: 4, fontWeight: "700" }, gradeCoverageReview: { color: "#B86719" }, gradeAction: { color: "#5D58B5", fontSize: 9, fontWeight: "900", marginTop: 4 },
  trendHeader: { marginTop: 7, paddingHorizontal: 2 }, trendHelp: { color: "#837A71", fontSize: 12, lineHeight: 18, marginTop: 5 }, skillCard: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#F0E8DE", padding: 15 }, skillHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }, skillName: { fontSize: 15, fontWeight: "900" }, skillHint: { color: "#938980", fontSize: 10, fontWeight: "700" },
  weekCard: { backgroundColor: "#F5F2FF", borderRadius: 21, padding: 18, marginTop: 2 }, compareRow: { flexDirection: "row", gap: 8, marginTop: 14 }, compareItem: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 9 }, compareValue: { color: "#5D58B5", fontSize: 15, fontWeight: "900" }, compareLabel: { color: "#7A7289", fontSize: 10, lineHeight: 14, marginTop: 3, fontWeight: "700" }, noCompare: { color: "#7A7289", fontSize: 12, lineHeight: 18, marginTop: 12 }, exportRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 }, exportButton: { backgroundColor: "#5D58B5", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13 }, exportDisabled: { opacity: 0.56 }, exportText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, archiveButton: { backgroundColor: "#397C4A", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13 }, archiveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  goalCard: { backgroundColor: "#FFF0D7", borderRadius: 21, padding: 18, marginTop: 12 }, goalNumbers: { color: "#A65B1B", fontSize: 15, marginTop: 8, fontWeight: "900" }, goalBody: { color: "#805B38", fontSize: 13, lineHeight: 20, marginTop: 6 }, goalButton: { alignSelf: "flex-start", backgroundColor: "#F5803E", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, marginTop: 12 }, goalButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, suggestionCard: { backgroundColor: "#E8F6EC", borderRadius: 21, padding: 18, marginTop: 12 }, suggestion: { color: "#377347", fontSize: 14, lineHeight: 21, marginTop: 8, fontWeight: "700" }, note: { color: "#5D8267", fontSize: 12, lineHeight: 18, marginTop: 9 },
});
