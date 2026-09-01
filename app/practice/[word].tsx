import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { REVIEW_WORDS } from "@/lib/learning-data";
import { recordPronunciationScore } from "@/lib/learning-progress";
import { speakEnglish } from "@/lib/speech";
import { useSpeechGrade } from "@/lib/use-speech-grade";
import { ScreenContainer } from "@/components/screen-container";

export default function PronunciationPracticeScreen() {
  const router = useRouter();
  const { word: wordId } = useLocalSearchParams<{ word: string }>();
  const word = useMemo(() => REVIEW_WORDS.find((item) => item.id === wordId), [wordId]);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const grade = useSpeechGrade();
  if (!word) return <ScreenContainer className="items-center justify-center p-6"><Text>没有找到这个词汇。</Text></ScreenContainer>;

  const startRecording = async () => {
    setScore(null); setTranscript(""); setFeedback("");
    await grade.startRecording();
  };

  const stopAndGrade = async () => {
    try {
      const result = await grade.stopAndGrade(word.example);
      setScore(result.score); setTranscript(result.transcript); setFeedback(result.feedback);
      await recordPronunciationScore(result.score);
    } catch (error) {
      Alert.alert("评分暂未完成", error instanceof Error ? error.message : "请检查网络后重试。");
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="返回复习页" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.nav}>朗读评分</Text><View style={styles.space} /></View>
    <View style={styles.wordCard}><Text style={styles.word}>{word.word}</Text><Text style={styles.meaning}>{word.meaning}</Text><Text style={styles.example}>{word.example}</Text><Pressable accessibilityRole="button" accessibilityLabel="播放朗读示范" onPress={() => speakEnglish(word.example, true)} style={styles.demoButton}><Text style={styles.demoText}>🔊 听标准示范</Text></Pressable></View>
    <View style={styles.steps}><Text style={styles.step}>1. 先听示范</Text><Text style={styles.step}>2. 按住心里的节奏朗读例句</Text><Text style={styles.step}>3. 停止录音，获取识别与相似度评分</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={grade.isRecording ? "停止录音并评分" : "开始朗读录音"} disabled={grade.isPending} onPress={grade.isRecording ? stopAndGrade : startRecording} style={({ pressed }) => [styles.recordButton, grade.isRecording && styles.recording, pressed && { transform: [{ scale: 0.98 }] }, grade.isPending && { opacity: 0.6 }]}><Text style={styles.recordIcon}>{grade.isPending ? "…" : grade.isRecording ? "■" : "●"}</Text><Text style={styles.recordText}>{grade.isPending ? "正在识别…" : grade.isRecording ? "停止并评分" : "开始朗读"}</Text></Pressable>
    {grade.isPending ? <ActivityIndicator color="#F5803E" style={{ marginTop: 18 }} /> : null}
    {grade.partial ? <Text style={{ color: "#8A8178", fontSize: 13, fontStyle: "italic", marginTop: 10, textAlign: "center" }}>🎧 正在听：{grade.partial}</Text> : null}
    {score !== null ? <View style={styles.result}><Text style={styles.score}>{score}<Text style={styles.scoreUnit}> 分</Text></Text><Text style={styles.feedback}>{feedback}</Text><Text style={styles.transcriptTitle}>语音识别结果</Text><Text style={styles.transcript}>{transcript}</Text><Pressable accessibilityRole="button" accessibilityLabel="再练一次" onPress={startRecording} style={styles.again}><Text style={styles.againText}>再练一次</Text></Pressable></View> : <Text style={styles.privacy}>录音仅用于本次转写评分，评分后不在设备档案中保存音频。</Text>}
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 20, paddingBottom: 42, backgroundColor: "#FFF9F0" }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, nav: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, space: { width: 38 }, wordCard: { marginTop: 23, borderRadius: 25, backgroundColor: "#FFFFFF", padding: 22, alignItems: "center", borderWidth: 1, borderColor: "#EEE7DE" }, word: { fontSize: 32, fontWeight: "900", color: "#2E2A25" }, meaning: { fontSize: 16, color: "#7A7169", marginTop: 5 }, example: { fontSize: 15, color: "#5C554E", marginTop: 19, textAlign: "center", lineHeight: 23 }, demoButton: { marginTop: 16, backgroundColor: "#F5F2FF", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10 }, demoText: { color: "#5C58B5", fontWeight: "900", fontSize: 13 }, steps: { marginTop: 21, gap: 7 }, step: { color: "#746C64", fontSize: 13 }, recordButton: { height: 68, marginTop: 23, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#F5803E", flexDirection: "row", gap: 10 }, recording: { backgroundColor: "#D6595F" }, recordIcon: { color: "#FFFFFF", fontSize: 20 }, recordText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, privacy: { textAlign: "center", color: "#8C8177", fontSize: 12, lineHeight: 18, marginTop: 20, paddingHorizontal: 12 }, result: { marginTop: 19, borderRadius: 22, padding: 18, backgroundColor: "#E7F6EB", alignItems: "center" }, score: { color: "#2D8441", fontSize: 36, fontWeight: "900" }, scoreUnit: { fontSize: 15 }, feedback: { color: "#397A4B", fontSize: 14, fontWeight: "800", marginTop: 6, textAlign: "center" }, transcriptTitle: { alignSelf: "flex-start", color: "#568263", fontSize: 12, fontWeight: "900", marginTop: 15 }, transcript: { alignSelf: "flex-start", color: "#446850", fontSize: 14, lineHeight: 20, marginTop: 4 }, again: { marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 13, paddingVertical: 10, paddingHorizontal: 17 }, againText: { color: "#2D8441", fontWeight: "900", fontSize: 13 },
});
