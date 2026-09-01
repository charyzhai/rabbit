import { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { RabbitAvatar } from "@/components/rabbit-avatar";
import { getDailyPlan } from "@/lib/learning-analytics";
import { LESSONS, LEVELS } from "@/lib/learning-data";
import { getRecentLearningResume } from "@/lib/learning-resume";
import { DEFAULT_PROGRESS, dateKey, LearningProgress, loadProgress } from "@/lib/learning-progress";
import { ScreenContainer } from "@/components/screen-container";

export default function HomeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);
  useFocusEffect(useCallback(() => { loadProgress().then(setProgress); }, []));
  const nextLesson = useMemo(() => LESSONS.find((lesson) => !progress.completedLessonIds.includes(lesson.id)) ?? LESSONS[0], [progress.completedLessonIds]);
  const activeLevel = LEVELS.find((level) => level.id === nextLesson.levelId) ?? LEVELS[0];
  const plan = getDailyPlan(progress, dateKey());
  const recentLearning = getRecentLearningResume(progress);
  const goLesson = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/lesson/[id]", params: { id: nextLesson.id } }); };
  const resumeLearning = () => { if (!recentLearning) return; if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: recentLearning.path as never, params: recentLearning.params } as never); };

  return <ScreenContainer><FlatList data={["home"]} keyExtractor={(item) => item} contentContainerStyle={styles.content} renderItem={() => <>
    <View style={styles.header}><View><Text style={styles.welcome}>今天，和兔兔一起学习</Text><Text style={styles.headline}>一小关，积累一大步</Text></View><RabbitAvatar size={74} /></View>
    <View style={styles.hero}><View style={styles.heroText}><Text style={styles.heroTag}>{activeLevel.title}</Text><Text style={styles.heroTitle}>{nextLesson.title}</Text><Text style={styles.heroMeta}>{nextLesson.scene} · {nextLesson.questions.length} 道题 · 约 {nextLesson.estimatedMinutes} 分钟</Text><Pressable accessibilityRole="button" accessibilityLabel={`开始${nextLesson.title}学习关`} onPress={goLesson} style={({ pressed }) => [styles.primaryButton, pressed && { transform: [{ scale: 0.98 }] }]}><Text style={styles.primaryButtonText}>继续闯关</Text><Text style={styles.arrow}>→</Text></Pressable></View><Text style={styles.heroEmoji}>{activeLevel.icon}</Text></View>
    {recentLearning ? <Pressable accessibilityRole="button" accessibilityLabel={`恢复最近学习：${recentLearning.title}`} onPress={resumeLearning} style={({ pressed }) => [styles.resumeCard, pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 }]}><Text style={styles.resumeIcon}>{recentLearning.icon}</Text><View style={styles.resumeCopy}><Text style={styles.resumeKicker}>继续上次学习</Text><Text style={styles.resumeTitle}>{recentLearning.title}</Text><Text style={styles.resumeBody}>{recentLearning.detail}</Text></View><Text style={styles.resumeArrow}>继续 ›</Text></Pressable> : null}
    <View style={styles.sectionHead}><Text style={styles.sectionTitle}>每日学习计划</Text><Text style={styles.sectionCaption}>{plan.isComplete ? "已完成" : `还差 ${plan.remaining} 关`}</Text></View>
    <View style={styles.planCard}><View><Text style={styles.planTitle}>今日目标：完成 {plan.goal} 个短关卡</Text><Text style={styles.planBody}>{plan.completed}/{plan.goal} 已完成 · {plan.record.minutes} 分钟学习时长</Text></View><View style={styles.planCircle}><Text style={styles.planNumber}>{plan.completed}/{plan.goal}</Text></View></View>
    <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statEmoji}>⭐</Text><Text style={styles.statValue}>{progress.totalStars}</Text><Text style={styles.statLabel}>累计星星</Text></View><View style={styles.stat}><Text style={styles.statEmoji}>🔥</Text><Text style={styles.statValue}>{progress.streak}</Text><Text style={styles.statLabel}>连续学习</Text></View><View style={styles.stat}><Text style={styles.statEmoji}>📚</Text><Text style={styles.statValue}>{progress.completedLessonIds.length}/{LESSONS.length}</Text><Text style={styles.statLabel}>课程进度</Text></View></View>
    <View style={styles.tipCard}><Text style={styles.tipIcon}>🧩</Text><View style={styles.tipText}><Text style={styles.tipTitle}>今天试试四种学习本领</Text><Text style={styles.tipBody}>每个主题都有词义、拼写、场景对话和跟读挑战；慢慢完成，就会越学越自信。</Text></View></View>
    <View style={styles.moduleRow}><Pressable accessibilityRole="button" accessibilityLabel="打开每日一读" onPress={() => router.push("/reading" as never)} style={({ pressed }) => [styles.moduleCard, styles.readingCard, pressed && { opacity: 0.82 }]}><Text style={styles.moduleIcon}>📖</Text><View style={styles.moduleCopy}><Text style={styles.moduleTitle}>每日一读</Text><Text style={styles.moduleBody}>{progress.completedReadingIds.length} 篇已点亮 · 名句和故事</Text></View><Text style={styles.moduleArrow}>›</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="打开语法小站" onPress={() => router.push("/grammar" as never)} style={({ pressed }) => [styles.moduleCard, styles.grammarCard, pressed && { opacity: 0.82 }]}><Text style={styles.moduleIcon}>⚙️</Text><View style={styles.moduleCopy}><Text style={styles.moduleTitle}>语法小站</Text><Text style={styles.moduleBody}>G3 起逐步练习</Text></View><Text style={styles.moduleArrow}>›</Text></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityLabel="打开角色对话练习" onPress={() => router.push("/dialogue" as never)} style={({ pressed }) => [styles.dialogueCard, pressed && { opacity: 0.82 }]}><Text style={styles.moduleIcon}>💬</Text><View style={styles.moduleCopy}><Text style={styles.moduleTitle}>角色对话小剧场</Text><Text style={styles.moduleBody}>按单元句型练习开口交流</Text></View><Text style={styles.moduleArrow}>›</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="打开G1到G7分级内容馆" onPress={() => router.push("/grade-library" as never)} style={({ pressed }) => [styles.gradeLibraryCard, pressed && { opacity: 0.82 }]}><Text style={styles.gradeLibraryIcon}>🗺️</Text><View style={styles.moduleCopy}><Text style={styles.moduleTitle}>G1—G7 分级内容馆</Text><Text style={styles.moduleBody}>查看每个年级的主题、重点和训练方式</Text></View><Text style={styles.moduleArrow}>›</Text></Pressable>
  </>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  welcome: { color: "#46A758", fontSize: 13, fontWeight: "900" },
  headline: { color: "#2E2A25", fontSize: 25, lineHeight: 32, fontWeight: "900", marginTop: 5 },
  hero: { minHeight: 196, backgroundColor: "#F5803E", borderRadius: 28, padding: 22, overflow: "hidden", flexDirection: "row", justifyContent: "space-between" },
  heroText: { flex: 1, zIndex: 1 },
  heroTag: { alignSelf: "flex-start", color: "#B95019", backgroundColor: "#FFE6CF", paddingVertical: 5, paddingHorizontal: 10, borderRadius: 11, fontSize: 12, fontWeight: "900" },
  heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 30, fontWeight: "900", marginTop: 12 },
  heroMeta: { color: "#FFF0E5", fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 230 },
  primaryButton: { flexDirection: "row", backgroundColor: "#FFFFFF", alignSelf: "flex-start", borderRadius: 15, paddingVertical: 11, paddingHorizontal: 15, marginTop: 17, alignItems: "center", gap: 11 },
  primaryButtonText: { color: "#C2541D", fontSize: 14, fontWeight: "900" },
  arrow: { color: "#C2541D", fontSize: 19, fontWeight: "900", marginTop: -2 },
  heroEmoji: { fontSize: 72, alignSelf: "flex-end", opacity: 0.96, marginLeft: -15 }, resumeCard: { backgroundColor: "#F3EEFF", borderRadius: 21, padding: 15, marginTop: 13, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2D9FF" }, resumeIcon: { fontSize: 27, marginRight: 11 }, resumeCopy: { flex: 1 }, resumeKicker: { color: "#6B58B2", fontSize: 11, fontWeight: "900" }, resumeTitle: { color: "#403661", fontSize: 15, fontWeight: "900", marginTop: 3 }, resumeBody: { color: "#716A8F", fontSize: 11, lineHeight: 16, marginTop: 3 }, resumeArrow: { color: "#5D58B5", fontSize: 12, fontWeight: "900" },
  sectionHead: { marginTop: 20, marginBottom: 9, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { color: "#2E2A25", fontSize: 17, fontWeight: "900" },
  sectionCaption: { color: "#948B82", fontSize: 12, fontWeight: "700" },
  planCard: { backgroundColor: "#E7F6EB", padding: 16, borderRadius: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planTitle: { color: "#2D7440", fontSize: 14, fontWeight: "900" },
  planBody: { color: "#578061", fontSize: 12, marginTop: 6 },
  planCircle: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  planNumber: { color: "#3E9051", fontWeight: "900", fontSize: 13 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 13 },
  stat: { flex: 1, minHeight: 100, borderRadius: 20, backgroundColor: "#FFFFFF", padding: 13, borderWidth: 1, borderColor: "#F0EAE1" },
  statEmoji: { fontSize: 18 },
  statValue: { color: "#2E2A25", fontSize: 21, fontWeight: "900", marginTop: 8 },
  statLabel: { color: "#8A8178", fontSize: 11, fontWeight: "700", marginTop: 3 },
  tipCard: { backgroundColor: "#FFF5E4", borderRadius: 21, padding: 17, flexDirection: "row", marginTop: 16 },
  tipIcon: { fontSize: 26, marginRight: 12 },
  tipText: { flex: 1 },
  tipTitle: { color: "#9A601C", fontWeight: "900", fontSize: 15 },
  tipBody: { color: "#815F3E", fontSize: 13, lineHeight: 19, marginTop: 5 },
  moduleRow: { gap: 11, marginTop: 14 }, moduleCard: { minHeight: 75, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center" }, readingCard: { backgroundColor: "#EAF6FF" }, grammarCard: { backgroundColor: "#F3EEFF" }, dialogueCard: { minHeight: 75, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center", marginTop: 11, backgroundColor: "#FFF0D7" }, gradeLibraryCard: { minHeight: 75, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center", marginTop: 11, backgroundColor: "#E7F6EB" }, gradeLibraryIcon: { fontSize: 24, marginRight: 11 }, moduleIcon: { fontSize: 24, marginRight: 11 }, moduleCopy: { flex: 1 }, moduleTitle: { color: "#39332E", fontSize: 15, fontWeight: "900" }, moduleBody: { color: "#746B62", fontSize: 12, marginTop: 4, fontWeight: "700" }, moduleArrow: { color: "#7F766E", fontSize: 27, fontWeight: "700" },
});
