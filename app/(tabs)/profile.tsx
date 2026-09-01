import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { RabbitAvatar } from "@/components/rabbit-avatar";
import { LineChart } from "@/components/line-chart";
import { StreakMilestoneCard } from "@/components/streak-milestone-card";
import { LESSONS, LEVELS, REVIEW_WORDS } from "@/lib/learning-data";
import { getStreakMilestone, getVocabularyTrend, getWeakWords } from "@/lib/learning-insights";
import { claimStreakMilestone, dateKey, DEFAULT_PROGRESS, getActiveProfile, LearningProgress, loadProgress } from "@/lib/learning-progress";
import { ScreenContainer } from "@/components/screen-container";

export default function ProfileScreen() {
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);
  const [childName, setChildName] = useState("小兔同学");
  const [milestone, setMilestone] = useState<number | null>(null);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    loadProgress().then((next) => { setProgress(next); setMilestone(getStreakMilestone(next)); });
    getActiveProfile().then((profile) => setChildName(profile.name));
  }, []));

  const lessonsPerLevel = Math.max(1, LESSONS.length / LEVELS.length);
  const currentLevel = LEVELS[Math.min(Math.floor(progress.completedLessonIds.length / lessonsPerLevel), LEVELS.length - 1)];
  const completedSkills = Object.values(progress.skillPracticeCounts).reduce((total, count) => total + count, 0);
  const vocabularyTrend = getVocabularyTrend(progress, dateKey());
  const weakWords = getWeakWords(progress, REVIEW_WORDS);
  const cards = [
    { label: "累计星星", value: `${progress.totalStars}`, accent: "#FFF0D7", color: "#B65B18" },
    { label: "连续学习", value: `${progress.streak} 天`, accent: "#E5F5E9", color: "#2D8441" },
    { label: "已闯关卡", value: `${progress.completedLessonIds.length}/${LESSONS.length}`, accent: "#ECEBFF", color: "#5C58BA" },
    { label: "待复习词", value: `${progress.reviewWordIds.length}`, accent: "#FCE8EF", color: "#AE3F67" },
    { label: "技能练习", value: `${completedSkills} 次`, accent: "#EAF6FF", color: "#3676A3" },
    { label: "阅读点亮", value: `${progress.completedReadingIds.length} 篇`, accent: "#FFF5E4", color: "#A66A1F" },
  ];
  const claimMilestone = async () => { if (!milestone) return; const updated = await claimStreakMilestone(milestone); setProgress(updated); setMilestone(null); };

  return <ScreenContainer><FlatList data={cards} numColumns={2} keyExtractor={(item) => item.label} contentContainerStyle={styles.content} columnWrapperStyle={styles.gridRow} ListHeaderComponent={<><View style={styles.hero}><RabbitAvatar size={88} accent="#FDE5CE" /><View style={styles.heroText}><Text style={styles.eyebrow}>我的学习</Text><Text style={styles.name}>{childName}</Text><Text style={styles.current}>{currentLevel.title} · {currentLevel.subtitle}</Text></View></View>{milestone ? <StreakMilestoneCard days={milestone} onClaim={claimMilestone} /> : null}</>} ListFooterComponent={<><View style={styles.trendCard}><Text style={styles.trendTitle}>词汇掌握趋势</Text><Text style={styles.trendBody}>最近7天的词义、连线和关卡正确率。</Text><LineChart points={vocabularyTrend} /></View><View style={styles.weakCard}><View style={styles.weakHead}><View style={styles.weakCopy}><Text style={styles.weakTitle}>需多练的词</Text><Text style={styles.weakBody}>{weakWords.length ? "先练这几词，兔兔会安排更合适的复习。" : "词图连线答错的词会出现在这里。"}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="去复习薄弱词" onPress={() => router.push("/(tabs)/review" as never)} style={styles.weakButton}><Text style={styles.weakButtonText}>去复习</Text></Pressable></View>{weakWords.length ? <View style={styles.weakChips}>{weakWords.map((word) => <View key={word.id} style={styles.weakChip}><Text style={styles.weakWord}>{word.word}</Text><Text style={styles.weakMeaning}>{word.meaning}</Text></View>)}</View> : null}</View><Pressable accessibilityRole="button" accessibilityLabel="管理儿童学习档案" onPress={() => router.push({ pathname: "/parent-gate", params: { target: "children" } } as never)} style={styles.childButton}><View><Text style={styles.reportEyebrow}>儿童档案</Text><Text style={styles.reportTitle}>切换或添加学习者</Text><Text style={styles.reportBody}>每位孩子独立保存学习进度和报告。</Text></View><Text style={styles.reportArrow}>›</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="查看家长学习报告" onPress={() => router.push({ pathname: "/parent-gate", params: { target: "report" } } as never)} style={styles.reportButton}><View><Text style={styles.reportEyebrow}>家庭陪学</Text><Text style={styles.reportTitle}>查看家长学习报告</Text><Text style={styles.reportBody}>查看完成关卡、学习时长、正确率和陪学建议。</Text></View><Text style={styles.reportArrow}>›</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="打开家长设置与档案备份" onPress={() => router.push({ pathname: "/parent-gate", params: { target: "parent-settings" } } as never)} style={styles.settingsButton}><Text style={styles.settingsText}>⚙ 家长PIN与档案备份</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="查看 App 信息" onPress={() => router.push("/app-info" as never)} style={styles.settingsButton}><Text style={styles.settingsText}>ℹ App 信息</Text></Pressable><View style={styles.tip}><Text style={styles.tipTitle}>兔兔小提醒</Text><Text style={styles.tipText}>{progress.reviewWordIds.length ? "先温习待复习词，再去挑战新关卡，会学得更牢。" : "今天状态很好！完成一关，就能收获新的星星。"}</Text></View></>} renderItem={({ item }) => <View style={[styles.statCard, { backgroundColor: item.accent }]}><Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text><Text style={styles.statLabel}>{item.label}</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 110, gap: 14 }, hero: { backgroundColor: "#FFFFFF", borderRadius: 26, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#EEE8DE" }, heroText: { marginLeft: 15, flex: 1 }, eyebrow: { color: "#46A758", fontSize: 12, fontWeight: "900" }, name: { color: "#2E2A25", fontSize: 20, fontWeight: "900", marginTop: 4 }, current: { color: "#746D65", fontSize: 13, marginTop: 5, lineHeight: 19 }, gridRow: { justifyContent: "space-between", gap: 14 }, statCard: { width: "48%", borderRadius: 20, padding: 17, minHeight: 106, justifyContent: "space-between" }, statValue: { fontSize: 25, fontWeight: "900" }, statLabel: { color: "#675F57", fontWeight: "700", fontSize: 13, marginTop: 18 },
  milestoneCard: { backgroundColor: "#FFF0D7", borderRadius: 20, padding: 14, marginTop: 12, flexDirection: "row", alignItems: "center" }, milestoneEmoji: { fontSize: 28, marginRight: 9 }, milestoneCopy: { flex: 1 }, milestoneTitle: { color: "#8C521B", fontSize: 14, fontWeight: "900" }, milestoneBody: { color: "#946A41", fontSize: 11, lineHeight: 16, marginTop: 3 }, claimButton: { backgroundColor: "#F5803E", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 8 }, claimText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  trendCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE8DE", borderRadius: 22, padding: 18, marginTop: 2, marginBottom: 12 }, trendTitle: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, trendBody: { color: "#7D746B", fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 8 }, weakCard: { backgroundColor: "#EAF6FF", borderRadius: 22, padding: 18, marginBottom: 12 }, weakHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }, weakCopy: { flex: 1 }, weakTitle: { color: "#306D98", fontSize: 16, fontWeight: "900" }, weakBody: { color: "#5E7E93", fontSize: 12, lineHeight: 18, marginTop: 5 }, weakButton: { backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 }, weakButtonText: { color: "#306D98", fontSize: 12, fontWeight: "900" }, weakChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 }, weakChip: { backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 }, weakWord: { color: "#366A89", fontSize: 12, fontWeight: "900" }, weakMeaning: { color: "#728B9B", fontSize: 10, marginTop: 2 },
  childButton: { borderRadius: 22, padding: 18, backgroundColor: "#E7F6EB", marginTop: 2, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, reportButton: { borderRadius: 22, padding: 18, backgroundColor: "#ECEBFF", marginTop: 2, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, reportEyebrow: { color: "#5D58B5", fontSize: 12, fontWeight: "900" }, reportTitle: { color: "#393473", fontSize: 16, fontWeight: "900", marginTop: 4 }, reportBody: { color: "#6C68A2", fontSize: 12, lineHeight: 18, marginTop: 4, maxWidth: 260 }, reportArrow: { color: "#5D58B5", fontSize: 31, marginTop: -3 }, settingsButton: { borderRadius: 16, backgroundColor: "#FFF0D7", alignItems: "center", paddingVertical: 12, marginBottom: 12 }, settingsText: { color: "#8A561E", fontSize: 13, fontWeight: "900" }, tip: { borderRadius: 22, padding: 19, backgroundColor: "#FFF5E4", borderWidth: 1, borderColor: "#FFE5B6" }, tipTitle: { fontSize: 15, fontWeight: "900", color: "#7A4E1B" }, tipText: { fontSize: 14, color: "#795E43", lineHeight: 21, marginTop: 8 },
});
