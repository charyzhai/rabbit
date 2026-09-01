import { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { DAILY_READINGS, type ReadingItem } from "@/lib/grade-content";
import { DEFAULT_PROGRESS, type LearningProgress, loadProgress, recordReadingCompletion } from "@/lib/learning-progress";
import { ScreenContainer } from "@/components/screen-container";
import { speakEnglish } from "@/lib/speech";

const successTap = () => { if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };

export default function ReadingScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { loadProgress().then(setProgress); }, []));
  const today = useMemo(() => DAILY_READINGS[new Date().getDate() % DAILY_READINGS.length], []);

  const complete = async (item: ReadingItem) => {
    const updated = await recordReadingCompletion(item.id);
    setProgress(updated); successTap();
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><FlatList data={DAILY_READINGS} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<><View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="返回上一页" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.navTitle}>每日一读</Text><Pressable accessibilityRole="button" accessibilityLabel="打开语法小站" onPress={() => router.push("/grammar" as never)} style={styles.grammarLink}><Text style={styles.grammarLinkText}>语法小站</Text></Pressable></View><View style={styles.hero}><Text style={styles.heroKicker}>今天的听读小任务</Text><Text style={styles.heroTitle}>{today.title}</Text><Text style={styles.heroZh}>{today.titleZh}</Text><Text style={styles.heroBody}>听一遍、跟读一遍，再点亮今天的阅读印章。</Text><Pressable accessibilityRole="button" accessibilityLabel="播放今日阅读示范" onPress={() => speakEnglish(today.text, true)} style={styles.heroButton}><Text style={styles.heroButtonText}>🔊 听今日示范</Text></Pressable></View><View style={styles.progressRow}><Text style={styles.progressLabel}>阅读收藏</Text><Text style={styles.progressValue}>{progress.completedReadingIds.length}/{DAILY_READINGS.length} 条已点亮</Text></View></>} renderItem={({ item }) => {
    const expanded = expandedId === item.id;
    const completed = progress.completedReadingIds.includes(item.id);
    return <View style={[styles.card, item.kind === "story" ? styles.storyCard : styles.quoteCard]}><View style={styles.cardHeader}><View><Text style={styles.kind}>{item.kind === "story" ? "分级故事" : "英语名句"} · {item.grades}</Text><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardZh}>{item.titleZh}</Text></View><Text style={styles.status}>{completed ? "✓ 已读" : item.kind === "story" ? "故事" : "名句"}</Text></View><Text numberOfLines={expanded ? undefined : 2} style={styles.english}>{item.text}</Text>{expanded ? <><View style={styles.keyWords}><Text style={styles.keyLabel}>核心词</Text><Text style={styles.keyValue}>{item.keyWords.join(" · ")}</Text></View><Text style={styles.meaning}>{item.meaningZh}</Text></> : null}<View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`播放${item.title}英文示范`} onPress={() => speakEnglish(item.text, true)} style={styles.listen}><Text style={styles.listenText}>🔊 听读</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={expanded ? "收起阅读内容" : "展开阅读内容"} onPress={() => setExpandedId(expanded ? null : item.id)} style={styles.expand}><Text style={styles.expandText}>{expanded ? "收起" : "阅读"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`完成${item.title}阅读`} onPress={() => complete(item)} style={[styles.complete, completed && styles.completed]}><Text style={[styles.completeText, completed && styles.completedText]}>{completed ? "已点亮" : "完成阅读"}</Text></Pressable></View></View>;
  }} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42, gap: 13, backgroundColor: "#FFF9F0" }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE", alignItems: "center", justifyContent: "center" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, navTitle: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, grammarLink: { backgroundColor: "#F3EEFF", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 }, grammarLinkText: { color: "#5C58B5", fontSize: 12, fontWeight: "900" },
  hero: { borderRadius: 25, backgroundColor: "#F5803E", padding: 20, marginTop: 13 }, heroKicker: { color: "#FFE4CD", fontSize: 12, fontWeight: "900" }, heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 30, fontWeight: "900", marginTop: 7 }, heroZh: { color: "#FFF1E5", fontSize: 14, fontWeight: "800", marginTop: 4 }, heroBody: { color: "#FFF2E7", fontSize: 12, lineHeight: 19, marginTop: 11 }, heroButton: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 }, heroButtonText: { color: "#C35D20", fontSize: 13, fontWeight: "900" },
  progressRow: { marginTop: 20, marginBottom: 1, flexDirection: "row", justifyContent: "space-between" }, progressLabel: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, progressValue: { color: "#8A8178", fontSize: 12, fontWeight: "800" },
  card: { padding: 17, borderRadius: 22, borderWidth: 1 }, quoteCard: { backgroundColor: "#FFFFFF", borderColor: "#EDE7DE" }, storyCard: { backgroundColor: "#F3EEFF", borderColor: "#E2D9FF" }, cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, kind: { color: "#887E73", fontSize: 11, fontWeight: "900" }, cardTitle: { color: "#2E2A25", fontSize: 18, fontWeight: "900", marginTop: 5, maxWidth: 235 }, cardZh: { color: "#756C63", fontSize: 13, fontWeight: "700", marginTop: 4 }, status: { color: "#2D8441", backgroundColor: "#E3F7E8", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignSelf: "flex-start", fontSize: 10, fontWeight: "900" }, english: { color: "#3F3832", fontSize: 15, lineHeight: 23, marginTop: 15, fontWeight: "700" }, keyWords: { backgroundColor: "#FFFFFFB8", borderRadius: 13, padding: 11, marginTop: 13 }, keyLabel: { color: "#71669C", fontSize: 11, fontWeight: "900" }, keyValue: { color: "#50496A", fontSize: 13, lineHeight: 20, marginTop: 4, fontWeight: "700" }, meaning: { color: "#625A52", fontSize: 13, lineHeight: 20, marginTop: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 15 }, listen: { backgroundColor: "#EAF6FF", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 }, listenText: { color: "#3676A3", fontSize: 12, fontWeight: "900" }, expand: { backgroundColor: "#FFF0D7", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 }, expandText: { color: "#A65B1B", fontSize: 12, fontWeight: "900" }, complete: { flex: 1, backgroundColor: "#46A758", borderRadius: 12, alignItems: "center", justifyContent: "center", minHeight: 36 }, completed: { backgroundColor: "#E3F7E8" }, completeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, completedText: { color: "#2D8441" },
});
