import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ROLE_DIALOGUES } from "@/lib/role-dialogue-data";
import { recordDialogueCompletion, recordDialoguePronunciation, recordLearningMistake, recordModuleActivity, recordSkillPractice } from "@/lib/learning-progress";
import { getPronunciationReward, type PronunciationReward } from "@/lib/practice-rewards";
import { speakEnglish } from "@/lib/speech";
import { useSpeechGrade } from "@/lib/use-speech-grade";
import { FeedbackRabbit, type RabbitFeedbackState } from "@/components/feedback-rabbit";
import { ScreenContainer } from "@/components/screen-container";
import { TransitionIn } from "@/components/transition-in";

const haptic = (good: boolean) => { if (Platform.OS !== "web") Haptics.notificationAsync(good ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error); };

export default function DialogueScreen() {
  const router = useRouter();
  const grade = useSpeechGrade();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [roleSwitched, setRoleSwitched] = useState(false);
  const [rabbitState, setRabbitState] = useState<RabbitFeedbackState>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [reward, setReward] = useState<PronunciationReward | null>(null);
  const [finished, setFinished] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const dialogue = ROLE_DIALOGUES[index];
  const good = selected === dialogue.answer;
  const targetText = roleSwitched ? dialogue.rabbitLine : dialogue.answer;

  const choose = async (value: string) => {
    if (selected) return;
    setSelected(value);
    const correct = value === dialogue.answer;
    setRabbitState(correct ? "success" : "retry");
    haptic(correct);
    await recordModuleActivity("dialogue", { correct });
    if (correct) {
      await recordSkillPractice("context");
      await speakEnglish(`${dialogue.rabbitLine} ${dialogue.answer}`, true);
    } else await recordLearningMistake(dialogue.reviewWordId);
  };
  const startRecording = async () => {
    setScore(null); setTranscript(""); setReward(null);
    await grade.startRecording();
  };
  const stopAndGrade = async () => {
    try {
      const result = await grade.stopAndGrade(targetText);
      const nextReward = getPronunciationReward(result.score);
      setScore(result.score); setTranscript(result.transcript); setReward(nextReward);
      await recordDialoguePronunciation(dialogue.id, result.score, nextReward.stars);
      await recordSkillPractice("speaking");
      setRabbitState(nextReward.stars >= 2 ? "success" : "idle");
      haptic(nextReward.stars >= 2);
    } catch (error) {
      Alert.alert("评分暂未完成", error instanceof Error ? error.message : "请检查网络后重试。");
    }
  };
  const next = async () => {
    if (isAdvancing) return;
    if (index === ROLE_DIALOGUES.length - 1) { setIsAdvancing(true); try { await recordDialogueCompletion(); setFinished(true); } finally { setIsAdvancing(false); } return; }
    setIndex((value) => value + 1); setSelected(null); setRoleSwitched(false); setRabbitState("idle"); setScore(null); setTranscript(""); setReward(null);
  };
  const retry = () => { setSelected(null); setRabbitState("idle"); };
  const switchRole = async () => { const nextRole = !roleSwitched; setRoleSwitched(nextRole); setScore(null); setReward(null); await speakEnglish(nextRole ? dialogue.rabbitLine : dialogue.answer, true); };

  if (finished) return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.finishPage}><FeedbackRabbit state="complete" size={92} /><Text style={styles.finishKicker}>💬 对话小演员</Text><Text style={styles.finishTitle}>七段角色对话完成啦！</Text><Text style={styles.finishBody}>你已经练习了问候、邀请、问路、出行、购物、过去时和社团交流。答错的重点词已安排进复习。</Text><Pressable accessibilityRole="button" accessibilityLabel="从第一段重新练习角色对话" onPress={() => { setIndex(0); setSelected(null); setFinished(false); setRabbitState("idle"); }} style={styles.nextButton}><Text style={styles.nextText}>从第1段再练一次</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="返回今天学习" onPress={() => router.back()} style={styles.finishBack}><Text style={styles.finishBackText}>返回今天</Text></Pressable></View></ScreenContainer>;

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="返回上一页" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.track}><View style={[styles.trackFill, { width: `${((index + 1) / ROLE_DIALOGUES.length) * 100}%` }]} /></View><Text style={styles.count}>{index + 1}/{ROLE_DIALOGUES.length}</Text></View>
      <TransitionIn trigger={index}><View style={styles.hero}><View><Text style={styles.grade}>{dialogue.grade} · 单元句型角色扮演</Text><Text style={styles.title}>{dialogue.title}</Text><Text style={styles.scene}>📍 {dialogue.scene}</Text></View><FeedbackRabbit state={rabbitState} size={64} /></View>
      <View style={styles.dialogueBox}>
        <View style={styles.line}><View style={styles.rabbitAvatar}><Text style={styles.avatarText}>兔</Text></View><View style={styles.bubble}><Text style={styles.person}>兔兔</Text><Text style={styles.lineText}>{dialogue.rabbitLine}</Text><Pressable accessibilityRole="button" accessibilityLabel="播放兔兔台词" onPress={() => speakEnglish(dialogue.rabbitLine, true)}><Text style={styles.listen}>🔊 听一听</Text></Pressable></View></View>
        <View style={styles.line}><View style={[styles.rabbitAvatar, styles.friendAvatar]}><Text style={styles.avatarText}>我</Text></View><View style={[styles.bubble, styles.friendBubble]}><Text style={styles.person}>我来回答</Text><Text style={styles.lineText}>{good ? dialogue.answer : dialogue.prompt}</Text></View></View>
      </View>
      <Text style={styles.helper}>{dialogue.helper}</Text>
      <View style={styles.options}>{dialogue.options.map((option) => { const chosen = option === selected; const state = selected ? option === dialogue.answer ? styles.right : chosen ? styles.wrong : styles.dim : undefined; return <Pressable key={option} accessibilityRole="button" accessibilityLabel={`选择回复：${option}`} disabled={Boolean(selected)} onPress={() => choose(option)} style={({ pressed }) => [styles.option, state, pressed && !selected && { transform: [{ scale: 0.98 }] }]}><Text style={[styles.optionText, selected && option === dialogue.answer && styles.rightText, chosen && !good && styles.wrongText]}>{option}</Text></Pressable>; })}</View>
      {selected ? <View style={[styles.feedback, good ? styles.goodFeedback : styles.retryFeedback]}>
        <Text style={[styles.feedbackTitle, good ? styles.goodText : styles.retryText]}>{good ? "这句话说得真自然！" : "再想想场景里的提示"}</Text>
        <Text style={styles.feedbackBody}>{good ? "你可以直接进入下一段；也可以在下面选做跟读评分，多收集星星。" : dialogue.helper}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={good ? "进入下一段对话" : "重新选择回复"} disabled={isAdvancing} onPress={good ? next : retry} style={[styles.nextButton, isAdvancing && styles.disabled]}><Text style={styles.nextText}>{good ? isAdvancing ? "兔兔正在记录完成…" : "下一段对话 →" : "再试一次"}</Text></Pressable>
        {good ? <View style={styles.pronunciationArea}>
          <Text style={styles.optionalTitle}>选做 · 跟读评分</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="切换跟读角色" onPress={switchRole} style={styles.roleButton}><Text style={styles.roleText}>🔊 {roleSwitched ? "我来读兔兔的话" : "换角色：读我的台词"}</Text></Pressable>
          <Text style={styles.targetLine}>本次评分台词：{targetText}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={grade.isRecording ? "停止录音并评分" : "开始录音评分"} disabled={grade.isPending} onPress={grade.isRecording ? stopAndGrade : startRecording} style={[styles.recordButton, grade.isRecording && styles.recording, grade.isPending && styles.disabled]}><Text style={styles.recordText}>{grade.isPending ? "正在识别…" : grade.isRecording ? "■ 停止并评分" : "● 开始录音评分"}</Text></Pressable>
          {grade.isPending ? <ActivityIndicator color="#F5803E" style={styles.loading} /> : null}
          {grade.partial ? <Text style={{ color: "#8A8178", fontSize: 13, fontStyle: "italic", marginTop: 8, textAlign: "center" }}>🎧 正在听：{grade.partial}</Text> : null}
          {reward && score !== null ? <View style={styles.scoreCard}><Text style={styles.starLine}>{"⭐".repeat(reward.stars)}{"☆".repeat(3 - reward.stars)}</Text><Text style={styles.scoreText}>{score} 分 · {reward.title}</Text><Text style={styles.scoreBody}>{reward.message}</Text><Text style={styles.transcriptLabel}>识别到：{transcript || "未识别到完整文本"}</Text></View> : null}
        </View> : null}
      </View> : <Text style={styles.hint}>选好句子后，会立刻出现“下一段对话”或“再试一次”。</Text>}</TransitionIn>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 38, backgroundColor: "#FFF9F0" }, finishPage: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#FFF9F0" }, finishKicker: { color: "#B4621E", fontSize: 13, fontWeight: "900", marginTop: 16 }, finishTitle: { color: "#563719", fontSize: 24, fontWeight: "900", marginTop: 7 }, finishBody: { color: "#766B61", fontSize: 14, lineHeight: 22, marginTop: 9, textAlign: "center" }, finishBack: { paddingVertical: 10, paddingHorizontal: 16, marginTop: 8 }, finishBackText: { color: "#796F65", fontSize: 13, fontWeight: "900" }, top: { flexDirection: "row", alignItems: "center", gap: 10 }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE", alignItems: "center", justifyContent: "center" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, track: { flex: 1, height: 10, borderRadius: 8, overflow: "hidden", backgroundColor: "#E9E2D9" }, trackFill: { height: "100%", borderRadius: 8, backgroundColor: "#F5803E" }, count: { color: "#7E766D", fontSize: 12, fontWeight: "900" }, hero: { marginTop: 20, backgroundColor: "#FFF0D7", borderRadius: 24, padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, grade: { color: "#B4621E", fontSize: 12, fontWeight: "900" }, title: { color: "#563719", fontSize: 24, fontWeight: "900", marginTop: 5 }, scene: { color: "#8A623B", fontSize: 12, marginTop: 7, fontWeight: "700" }, dialogueBox: { marginTop: 19, backgroundColor: "#FFFFFF", borderRadius: 23, borderWidth: 1, borderColor: "#EEE7DE", padding: 15, gap: 14 }, line: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, rabbitAvatar: { width: 35, height: 35, borderRadius: 17, backgroundColor: "#F5803E", alignItems: "center", justifyContent: "center" }, friendAvatar: { backgroundColor: "#7B6FEA" }, avatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 }, bubble: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: "#FFF5E4" }, friendBubble: { backgroundColor: "#F3EEFF" }, person: { color: "#8D7A69", fontSize: 11, fontWeight: "900" }, lineText: { color: "#37312B", fontSize: 16, lineHeight: 23, fontWeight: "900", marginTop: 4 }, listen: { color: "#B4621E", fontSize: 12, fontWeight: "900", marginTop: 8 }, helper: { color: "#7A7169", fontSize: 12, lineHeight: 18, marginTop: 15, textAlign: "center", fontWeight: "700" }, options: { gap: 10, marginTop: 16 }, option: { minHeight: 54, justifyContent: "center", borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#E9E2D9", paddingHorizontal: 16 }, optionText: { color: "#3B3530", fontSize: 15, fontWeight: "900" }, right: { backgroundColor: "#E3F7E8", borderColor: "#46A758" }, wrong: { backgroundColor: "#FDE9E9", borderColor: "#D6595F" }, dim: { opacity: 0.5 }, rightText: { color: "#257739" }, wrongText: { color: "#AD3D47" }, feedback: { borderRadius: 20, padding: 16, marginTop: 16 }, goodFeedback: { backgroundColor: "#E3F7E8" }, retryFeedback: { backgroundColor: "#FFF0D7" }, feedbackTitle: { fontSize: 16, fontWeight: "900" }, goodText: { color: "#257739" }, retryText: { color: "#A65B1B" }, feedbackBody: { color: "#5F574F", lineHeight: 19, fontSize: 13, marginTop: 5 }, nextButton: { alignItems: "center", borderRadius: 13, paddingVertical: 12, backgroundColor: "#F5803E", marginTop: 13, minWidth: 190 }, nextText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, pronunciationArea: { borderTopWidth: 1, borderTopColor: "#BFE1C7", marginTop: 15, paddingTop: 14 }, optionalTitle: { color: "#4B7554", fontSize: 12, fontWeight: "900" }, roleButton: { alignItems: "center", borderRadius: 13, paddingVertical: 10, backgroundColor: "#FFFFFF", marginTop: 10 }, roleText: { color: "#5D58B5", fontSize: 13, fontWeight: "900" }, targetLine: { color: "#617A67", fontSize: 12, fontWeight: "800", marginTop: 12 }, recordButton: { alignItems: "center", borderRadius: 13, paddingVertical: 12, backgroundColor: "#F5803E", marginTop: 8 }, recording: { backgroundColor: "#D6595F" }, disabled: { opacity: 0.62 }, recordText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, loading: { marginTop: 10 }, scoreCard: { marginTop: 12, padding: 13, backgroundColor: "#FFFFFF", borderRadius: 15, alignItems: "center" }, starLine: { fontSize: 22, letterSpacing: 2 }, scoreText: { color: "#2D8441", fontSize: 15, fontWeight: "900", marginTop: 5 }, scoreBody: { color: "#4B7554", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 4 }, transcriptLabel: { color: "#66836D", fontSize: 11, marginTop: 8, textAlign: "center" }, hint: { color: "#938A81", fontSize: 12, textAlign: "center", marginTop: 18, fontWeight: "700" },
});
