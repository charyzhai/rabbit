import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { getUploadedWordsForLevel, type UploadedMaterialWord } from "@/lib/uploaded-vocabulary";
import type { LessonSkill } from "@/lib/learning-data";
import { getBunnyMicroStory, getMaterialBatchCompletionAction, getMaterialBatchCount, getMaterialBatchProgress, getMaterialWordBatch, MATERIAL_WORD_BATCH_SIZE } from "@/lib/material-learning";
import { recordLearningMistake, recordMaterialBatchCompletion, recordModuleActivity, recordSkillPractice } from "@/lib/learning-progress";
import { speakEnglish } from "@/lib/speech";
import { ScreenContainer } from "@/components/screen-container";
import { FeedbackRabbit, type RabbitFeedbackState } from "@/components/feedback-rabbit";
import { TransitionIn } from "@/components/transition-in";
import { ACTION_LAYOUT } from "@/lib/action-layout";
import { loadLearningPreferences } from "@/lib/learning-preferences";

type MaterialSkill = Exclude<LessonSkill, "grammar">;
type Task = { skill: MaterialSkill; prompt: string; helper: string; options: string[]; answer: string; targetText?: string };

const notify = (good: boolean) => { if (Platform.OS !== "web") Haptics.notificationAsync(good ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error); };
const otherItems = (items: UploadedMaterialWord[], index: number) => [items[(index + 1) % items.length], items[(index + 2) % items.length]].filter(Boolean);

export default function MaterialPracticeScreen() {
  const router = useRouter();
  const { level, batch } = useLocalSearchParams<{ level: string; batch?: string }>();
  const allItems = useMemo(() => getUploadedWordsForLevel(level ?? ""), [level]);
  const batchCount = getMaterialBatchCount(allItems.length);
  const requestedBatchIndex = useMemo(() => {
    const parsed = Number.parseInt(batch ?? "0", 10);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, batchCount - 1)) : 0;
  }, [batch, batchCount]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [rabbitState, setRabbitState] = useState<RabbitFeedbackState>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [batchReward, setBatchReward] = useState<{ icon: string; title: string; stars: number } | null>(null);
  const [batchFinished, setBatchFinished] = useState(false);
  const [isFinishingBatch, setIsFinishingBatch] = useState(false);
  const [autoAdvanceOnCorrect, setAutoAdvanceOnCorrect] = useState(false);
  const rewardScale = useRef(new Animated.Value(0.9)).current;
  const scrollRef = useRef<ScrollView>(null);
  const guideShift = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = useMemo(() => getMaterialWordBatch(allItems, batchIndex), [allItems, batchIndex]);
  const target = items[wordIndex];
  const story = getBunnyMicroStory(level ?? "");

  useEffect(() => {
    setBatchIndex(requestedBatchIndex);
    setWordIndex(0);
    setTaskIndex(0);
    setSelected(null);
    setRabbitState("idle");
    setBatchFinished(false);
  }, [level, requestedBatchIndex]);

  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 90);
    return () => clearTimeout(timer);
  }, [selected]);

  useEffect(() => { loadLearningPreferences().then((preferences) => setAutoAdvanceOnCorrect(preferences.autoAdvanceOnCorrect)); }, []);

  useEffect(() => {
    if (!selected) { guideShift.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([Animated.timing(guideShift, { toValue: 7, duration: 360, useNativeDriver: true }), Animated.timing(guideShift, { toValue: 0, duration: 360, useNativeDriver: true })]));
    animation.start();
    return () => animation.stop();
  }, [guideShift, selected]);

  useEffect(() => () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current); }, []);

  const tasks = useMemo<Task[]>(() => {
    if (!target) return [];
    const peers = otherItems(items, wordIndex);
    return [
      { skill: "meaning", prompt: `“${target.word}” 是什么意思？`, helper: `${target.sourceUnit} · 12词逐词学习`, options: [target.meaning, ...peers.map((item) => item.meaning)], answer: target.meaning },
    ];
  }, [items, target, wordIndex]);

  const task = tasks[taskIndex];
  if (!target || !task) return <ScreenContainer className="items-center justify-center p-6"><Text style={styles.error}>这个年级暂时没有新的材料词。</Text><Pressable onPress={() => router.back()} style={styles.returnButton}><Text style={styles.returnText}>返回内容馆</Text></Pressable></ScreenContainer>;

  const isCorrect = selected === task.answer;
  const finishedBatch = wordIndex === items.length - 1 && taskIndex === tasks.length - 1;
  const completedWords = wordIndex + (isCorrect && taskIndex === tasks.length - 1 ? 1 : 0);
  const batchProgress = getMaterialBatchProgress(completedWords, items.length);
  const batchCompletionAction = getMaterialBatchCompletionAction(batchIndex, batchCount);

  const select = async (value: string) => {
    if (selected) return;
    const correct = value === task.answer;
    setSelected(value);
    setRabbitState(correct ? "success" : "retry");
    notify(correct);
    await recordModuleActivity("material", { correct });
    if (correct) { setCorrectCount((count) => count + 1); await recordSkillPractice(task.skill); if (autoAdvanceOnCorrect) { autoAdvanceTimer.current = setTimeout(() => { autoAdvanceTimer.current = null; next(); }, 760); } }
    else await recordLearningMistake(target.id);
  };

  const resetTask = () => { setSelected(null); setRabbitState("idle"); };
  const advanceAfterBatch = () => {
    if (batchIndex < batchCount - 1) { setBatchIndex((value) => value + 1); setWordIndex(0); setTaskIndex(0); resetTask(); return; }
    router.replace("/(tabs)/review" as never);
  };
  const next = async () => {
    if (autoAdvanceTimer.current) { clearTimeout(autoAdvanceTimer.current); autoAdvanceTimer.current = null; }
    if (!isCorrect) { resetTask(); return; }
    if (taskIndex < tasks.length - 1) { setTaskIndex((value) => value + 1); resetTask(); return; }
    if (wordIndex < items.length - 1) { setWordIndex((value) => value + 1); setTaskIndex(0); resetTask(); return; }
    if (isFinishingBatch) return;
    setIsFinishingBatch(true);
    try {
      const reward = await recordMaterialBatchCompletion(target.levelId, batchIndex);
      await recordModuleActivity("material", { completed: 1 });
      setBatchReward(reward.isNew ? reward.badge : null);
      setBatchFinished(true);
      if (reward.isNew) { rewardScale.setValue(0.9); Animated.timing(rewardScale, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start(); notify(true); }
    } finally { setIsFinishingBatch(false); }
  };

  const continueNextBatch = () => { setBatchFinished(false); setBatchReward(null); advanceAfterBatch(); };
  const restartFromFirstBatch = () => { setBatchFinished(false); setBatchReward(null); setBatchIndex(0); setWordIndex(0); setTaskIndex(0); setCorrectCount(0); resetTask(); };

  const buttonLabel = !isCorrect ? "再试一次" : !finishedBatch ? "下一步" : batchIndex < batchCount - 1 ? `下一组 ${Math.min(MATERIAL_WORD_BATCH_SIZE, allItems.length - (batchIndex + 1) * MATERIAL_WORD_BATCH_SIZE)} 词` : "去复习词表";

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.page}>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="返回内容馆" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.progressCopy}><Text style={styles.progressTitle}>12词批次进度 · 第 {wordIndex + 1}/{items.length} 词</Text><View style={styles.track}><View style={[styles.trackFill, { width: `${batchProgress.percentage}%` }]} /></View><Text style={styles.progressDetail}>已完成 {completedWords}/{items.length} 词 · 本组还剩 {batchProgress.remainingWords} 词</Text></View></View>
      <TransitionIn trigger={`${batchIndex}-${wordIndex}-${taskIndex}`}><View style={styles.heading}><View style={styles.headingCopy}><Text style={styles.kicker}>新增短练习 · {target.levelId} · 第 {batchIndex + 1}/{batchCount} 组</Text><Text style={styles.title}>{target.word}</Text><Text style={styles.subtitle}>{target.meaning} · {target.sourceUnit}</Text><Text style={styles.module}>本组 {items.length} 词 · 每词 1 题 · {target.practice}</Text></View><FeedbackRabbit state={rabbitState} size={62} /></View>
      {story ? <Pressable accessibilityRole="button" accessibilityLabel="进入兔兔微故事三步挑战" onPress={() => router.push(`/micro-story-challenge/${story.levelId}` as never)} style={({ pressed }) => [styles.storyCard, pressed && { opacity: 0.82 }]}><Text style={styles.storyKicker}>📖 兔兔主题微故事 · {story.theme} · 点此挑战</Text><Text style={styles.storyTitle}>{story.title}</Text><Text style={styles.storyBody}>{story.body}</Text><Text style={styles.storyWords}>故事词：{story.focusWords.join(" · ")}</Text></Pressable> : null}
      <View style={styles.questionCard}><Text style={styles.helper}>{task.helper}</Text><Text style={styles.prompt}>{task.prompt}</Text>{task.skill === "listening" || task.skill === "speaking" ? <Pressable accessibilityRole="button" accessibilityLabel="播放英语示范" onPress={() => speakEnglish(task.targetText ?? target.word, true)} style={styles.listenButton}><Text style={styles.listenText}>🔊 听兔兔示范</Text></Pressable> : null}</View>
      {task.skill === "speaking" ? <Pressable accessibilityRole="button" accessibilityLabel="完成跟读" onPress={() => select("完成")} style={[styles.speakingButton, selected && styles.speakingDone]}><Text style={styles.speakingText}>{selected ? "✓ 我已跟读" : "🎙 我已跟读"}</Text></Pressable> : <View style={styles.options}>{task.options.map((option) => { const answer = option === task.answer; const chosen = option === selected; return <Pressable key={option} accessibilityRole="button" accessibilityLabel={`选择${option}`} disabled={Boolean(selected)} onPress={() => select(option)} style={({ pressed }) => [styles.option, selected && answer && styles.correctOption, selected && chosen && !answer && styles.wrongOption, selected && !chosen && !answer && styles.dimOption, pressed && !selected && { transform: [{ scale: 0.98 }] }]}><Text style={[styles.optionText, selected && answer && styles.correctOptionText, selected && chosen && !answer && styles.wrongOptionText]}>{option}</Text></Pressable>; })}</View>}
      {selected ? <View style={[styles.feedback, isCorrect ? styles.goodFeedback : styles.retryFeedback]}><Text style={[styles.feedbackTitle, isCorrect ? styles.goodText : styles.retryText]}>{isCorrect ? "答对啦！继续收集新词" : "没关系，再试一次"}</Text><Text style={styles.feedbackBody}>{isCorrect ? `${target.word}：${target.meaning}。${target.example}` : "再听一听提示，选出最合适的答案。"}</Text><Pressable accessibilityRole="button" accessibilityLabel={isCorrect ? "进入下一步练习" : "重新回答"} disabled={isFinishingBatch} onPress={next} style={[styles.nextButton, styles.inlineNextButton, isFinishingBatch && styles.nextButtonDisabled]}><Animated.Text style={[styles.guideArrow, { transform: [{ translateX: guideShift }] }]}>🐰 ➜</Animated.Text><Text style={styles.nextText}>{isFinishingBatch ? "兔兔正在保存…" : autoAdvanceOnCorrect && isCorrect ? "兔兔马上带你到下一词…" : buttonLabel}</Text></Pressable></View> : <Text style={styles.hint}>请选择最合适的答案。</Text>}
      <Text style={styles.score}>本次已完成 {correctCount} 步</Text></TransitionIn>
    </ScrollView>
      {batchFinished ? <View style={styles.rewardOverlay}><Animated.View style={[styles.rewardCard, { transform: [{ scale: batchReward ? rewardScale : 1 }] }]}><Text style={styles.rewardBurst}>✦ ✦ ✦</Text><Text style={styles.rewardIcon}>{batchReward?.icon ?? "🎯"}</Text><Text style={styles.rewardTitle}>{batchReward ? "太棒啦，获得小徽章！" : "这一组完成啦！"}</Text><Text style={styles.rewardName}>{batchReward ? batchReward.title : `你已完成第 ${batchIndex + 1} 组 ${items.length} 个新词`}</Text>{batchReward ? <Text style={styles.rewardStars}>+{batchReward.stars} 颗星星</Text> : <Text style={styles.rewardStars}>继续练习，会遇见更多新词！</Text>}<Pressable accessibilityRole="button" accessibilityLabel="继续下一组新增词" onPress={continueNextBatch} style={styles.rewardButton}><Text style={styles.rewardButtonText}>{batchCompletionAction === "continue" ? `继续第 ${batchIndex + 2} 组` : "完成全部，去复习"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="从第一组重新开始新增词练习" onPress={restartFromFirstBatch} style={styles.restartButton}><Text style={styles.restartButtonText}>从第1组重新开始</Text></Pressable></Animated.View></View> : null}
      {isFinishingBatch ? <View style={styles.finishingOverlay}><Text style={styles.finishingText}>兔兔正在收下这组学习记录…</Text></View> : null}
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF9F0", position: "relative" }, scrollContent: { padding: 20, paddingBottom: 46 }, top: { flexDirection: "row", alignItems: "center", gap: 10 }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE", alignItems: "center", justifyContent: "center" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, progressCopy: { flex: 1 }, progressTitle: { color: "#5B55A2", fontSize: 12, fontWeight: "900" }, track: { height: 10, backgroundColor: "#E9E2D9", borderRadius: 9, overflow: "hidden", marginTop: 6 }, trackFill: { height: "100%", backgroundColor: "#7B6FEA", borderRadius: 9 }, progressDetail: { color: "#857C73", fontSize: 10, fontWeight: "800", marginTop: 5 }, finishingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,249,240,0.72)", alignItems: "center", justifyContent: "center", padding: 28 }, finishingText: { color: "#6B5140", backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 13, fontWeight: "900", overflow: "hidden" },
  heading: { backgroundColor: "#F3EEFF", borderRadius: 24, padding: 18, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headingCopy: { flex: 1, paddingRight: 8 }, kicker: { color: "#625CAD", fontSize: 12, fontWeight: "900" }, title: { color: "#393473", fontSize: 26, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#736D99", fontSize: 13, marginTop: 5 }, module: { color: "#817AA5", fontSize: 11, marginTop: 7, fontWeight: "800" },
  storyCard: { backgroundColor: "#FFF1D3", borderRadius: 18, padding: 13, marginTop: 12, borderWidth: 1, borderColor: "#F5D18A" }, storyKicker: { color: "#A65B1B", fontSize: 11, fontWeight: "900" }, storyTitle: { color: "#70471D", fontSize: 14, fontWeight: "900", marginTop: 3 }, storyBody: { color: "#805B38", fontSize: 12, lineHeight: 18, marginTop: 5, fontWeight: "700" }, storyWords: { color: "#A56A2D", fontSize: 10, lineHeight: 15, marginTop: 7, fontWeight: "800" },
  questionCard: { marginTop: 19 }, helper: { color: "#887E75", fontSize: 12, fontWeight: "800" }, prompt: { color: "#302B26", fontSize: 22, lineHeight: 31, fontWeight: "900", marginTop: 9 }, listenButton: { alignSelf: "flex-start", backgroundColor: "#EEEAFE", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, marginTop: 14 }, listenText: { color: "#5B55A2", fontSize: 13, fontWeight: "900" }, options: { gap: 11, marginTop: 21 }, option: { minHeight: 58, paddingHorizontal: 18, borderRadius: 18, justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#E9E2D9" }, optionText: { color: "#3B3530", fontSize: 16, fontWeight: "900" }, correctOption: { backgroundColor: "#E3F7E8", borderColor: "#46A758" }, wrongOption: { backgroundColor: "#FDE9E9", borderColor: "#D6595F" }, dimOption: { opacity: 0.55 }, correctOptionText: { color: "#277B3B" }, wrongOptionText: { color: "#AD3D47" },
  speakingButton: { backgroundColor: "#7B6FEA", borderRadius: 18, minHeight: 64, marginTop: 21, alignItems: "center", justifyContent: "center" }, speakingDone: { backgroundColor: "#46A758" }, speakingText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, feedback: { borderRadius: 20, padding: 16, marginTop: 17 }, goodFeedback: { backgroundColor: "#E3F7E8" }, retryFeedback: { backgroundColor: "#FFF0D7" }, feedbackTitle: { fontSize: 17, fontWeight: "900" }, goodText: { color: "#277B3B" }, retryText: { color: "#A65B1B" }, feedbackBody: { color: "#5F574F", fontSize: 13, lineHeight: 20, marginTop: 5 }, inlineNextButton: { marginTop: 14 }, nextButton: { minHeight: ACTION_LAYOUT.primaryMinHeight, borderRadius: ACTION_LAYOUT.primaryRadius, backgroundColor: "#F5803E", paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, guideArrow: { color: "#FFFFFF", fontSize: 15 }, nextButtonDisabled: { opacity: 0.62 }, nextText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, hint: { color: "#8A8178", fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: "center" }, score: { color: "#8F857B", fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 15 }, rewardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(62, 45, 91, 0.38)", alignItems: "center", justifyContent: "center", padding: 24 }, rewardCard: { width: "100%", maxWidth: 340, backgroundColor: "#FFF9EE", borderRadius: 28, alignItems: "center", padding: 25, borderWidth: 3, borderColor: "#F7C85E" }, rewardBurst: { color: "#F5A623", fontSize: 19, fontWeight: "900", letterSpacing: 8 }, rewardIcon: { fontSize: 56, marginTop: 5 }, rewardTitle: { color: "#573C25", fontSize: 19, fontWeight: "900", marginTop: 7 }, rewardName: { color: "#8A5B2A", fontSize: 14, fontWeight: "800", marginTop: 6, textAlign: "center" }, rewardStars: { color: "#F5803E", fontSize: 14, fontWeight: "900", marginTop: 8, textAlign: "center" }, rewardButton: { minHeight: ACTION_LAYOUT.primaryMinHeight, marginTop: 19, backgroundColor: "#F5803E", borderRadius: ACTION_LAYOUT.primaryRadius, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center" }, rewardButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, restartButton: { minHeight: ACTION_LAYOUT.secondaryMinHeight, marginTop: 10, borderRadius: ACTION_LAYOUT.primaryRadius, borderWidth: 1.5, borderColor: "#D8A553", paddingHorizontal: 20, paddingVertical: 11, justifyContent: "center" }, restartButtonText: { color: "#8A5B2A", fontSize: 13, fontWeight: "900" }, error: { color: "#5F574F", fontSize: 15, textAlign: "center" }, returnButton: { minHeight: ACTION_LAYOUT.secondaryMinHeight, marginTop: 14, backgroundColor: "#7B6FEA", borderRadius: ACTION_LAYOUT.primaryRadius, paddingHorizontal: 16, paddingVertical: 11, justifyContent: "center" }, returnText: { color: "#FFFFFF", fontWeight: "900" },
});
