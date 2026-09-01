import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { FeedbackRabbit, type RabbitFeedbackState } from "@/components/feedback-rabbit";
import { TransitionIn } from "@/components/transition-in";
import { getLessonById, getPlayfulSceneLabel, type LessonSkill, type Question } from "@/lib/learning-data";
import { recordLessonResult } from "@/lib/learning-progress";
import { scheduleNextReviewReminder } from "@/lib/review-reminders";
import { ScreenContainer } from "@/components/screen-container";
import { useFeedbackSounds } from "@/hooks/use-feedback-sounds";
import { speakEnglish } from "@/lib/speech";
import { useSpeechGrade } from "@/lib/use-speech-grade";
import { answerCounterLabel } from "@/lib/lesson-flow";
import { ACTION_LAYOUT } from "@/lib/action-layout";

const haptic = (good: boolean) => { if (Platform.OS !== "web") Haptics.notificationAsync(good ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error); };
const SKILL_META: Record<LessonSkill, { badge: string; title: string; hint: string }> = {
  meaning: { badge: "词义", title: "词义小卡", hint: "先理解，再记住" },
  listening: { badge: "听辨", title: "听音选词", hint: "先听一听，再轻轻选" },
  spelling: { badge: "拼写", title: "拼写小工坊", hint: "一个字母一个字母来" },
  "word-complete": { badge: "补词", title: "字母气球", hint: "找回飞走的字母" },
  context: { badge: "语境", title: "场景对话", hint: "想一想，这里该怎么说" },
  speaking: { badge: "跟读", title: "跟读挑战", hint: "听一遍，勇敢读一遍" },
  grammar: { badge: "语法", title: "语法小站", hint: "读一读规则，再试一试" },
};

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useMemo(() => getLessonById(id ?? ""), [id]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [spellingLetters, setSpellingLetters] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const correctCountRef = useRef(0);
  const [skillResults, setSkillResults] = useState<{ skill: LessonSkill; correct: boolean }[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<string[]>([]);
  const [rabbitState, setRabbitState] = useState<RabbitFeedbackState>("idle");
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const [speakingTranscript, setSpeakingTranscript] = useState("");
  const [speakingError, setSpeakingError] = useState("");
  const grade = useSpeechGrade();
  const { soundsEnabled, play, toggleSounds } = useFeedbackSounds();

  const question = lesson?.questions[index];
  const playfulScene = lesson ? getPlayfulSceneLabel(lesson.scene) : "";
  const isCorrect = Boolean(question && selected === question.answer);
  const skill = question ? SKILL_META[question.skill] : null;

  const selectAnswer = (option: string) => {
    if (!question || selected) return;
    setSelected(option);
    const correct = option === question.answer;
    setRabbitState(correct ? "success" : "retry");
    haptic(correct);
    play(correct ? "success" : "retry");
    if (correct) setCorrectCount((value) => { const nextValue = value + 1; correctCountRef.current = nextValue; return nextValue; });
    else setIncorrectWords((items) => question.wordId ? Array.from(new Set([...items, question.wordId])) : items);
    setSkillResults((items) => [...items, { skill: question.skill, correct }]);
  };

  const chooseLetter = (letter: string) => {
    if (!question || selected) return;
    const missingCount = question.missingLetters?.length ?? 0;
    const attempted = [...spellingLetters, letter];
    setSpellingLetters(attempted);
    if (attempted.length === missingCount) selectAnswer(attempted.join(""));
  };

  const clearSpelling = () => { if (!selected) setSpellingLetters([]); };

  const startSpeaking = async () => {
    setSpeakingScore(null); setSpeakingFeedback(""); setSpeakingTranscript(""); setSpeakingError("");
    await grade.startRecording();
  };

  const stopAndGrade = async () => {
    if (!question) return;
    try {
      const result = await grade.stopAndGrade(question.targetText ?? question.explanation);
      setSpeakingScore(result.score); setSpeakingFeedback(result.feedback); setSpeakingTranscript(result.transcript);
    } catch (error) {
      setSpeakingError(error instanceof Error ? error.message : "评分暂时不可用。你仍可完成自我跟读后继续。 ");
    }
  };

  const completeSpeaking = () => { if (question) selectAnswer(question.answer); };

  const resetQuestion = useCallback(() => {
    setSelected(null); setSpellingLetters([]); setRabbitState("idle"); setSpeakingScore(null); setSpeakingFeedback(""); setSpeakingTranscript(""); setSpeakingError("");
  }, []);

  const next = useCallback(async () => {
    if (!lesson || !question) return;
    if (index < lesson.questions.length - 1) { setIndex((value) => value + 1); resetQuestion(); return; }
    const finalCorrect = correctCountRef.current;
    const earnedStars = finalCorrect === lesson.questions.length ? lesson.rewardStars : Math.max(1, lesson.rewardStars - 1);
    const skillMastery = skillResults.reduce((counts, item) => { const current = counts[item.skill] ?? { correct: 0, total: 0 }; return { ...counts, [item.skill]: { correct: current.correct + (item.correct ? 1 : 0), total: current.total + 1 } }; }, {} as Partial<Record<LessonSkill, { correct: number; total: number }>>);
    const updatedProgress = await recordLessonResult({ lessonId: lesson.id, earnedStars, incorrectWordIds: incorrectWords, correctAnswers: finalCorrect, totalAnswers: lesson.questions.length, minutesStudied: lesson.estimatedMinutes, skillPracticeCounts: lesson.questions.reduce((counts, item) => ({ ...counts, [item.skill]: (counts[item.skill] ?? 0) + 1 }), {} as Partial<Record<LessonSkill, number>>), skillMastery });
    if (incorrectWords.length) await scheduleNextReviewReminder(updatedProgress);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/lesson/complete", params: { title: lesson.title, stars: `${earnedStars}`, total: `${lesson.questions.length}`, correct: `${finalCorrect}` } });
  }, [incorrectWords, index, lesson, question, resetQuestion, router, skillResults]);

  useEffect(() => {
    if (!lesson || !question || !selected || !isCorrect) return;
    const timer = setTimeout(() => { void next(); }, 650);
    return () => clearTimeout(timer);
  }, [isCorrect, lesson, next, question, selected]);

  if (!lesson || !question || !skill) return <ScreenContainer className="items-center justify-center p-6"><Text style={styles.error}>这一关没有找到。请回到地图再试一次。</Text></ScreenContainer>;

  const progress = ((index + 1) / lesson.questions.length) * 100;
  const spellingWord = question.targetText?.split("") ?? [];
  const missing = new Set(question.missingLetters ?? []);
  const selectedText = spellingLetters.join("");
  const speakingDoneLabel = speakingScore !== null ? "收下鼓励，继续" : speakingError ? "我已完成跟读，继续" : "我已经跟读，继续";

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={styles.topbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="返回闯关地图" onPress={() => router.back()} style={({ pressed }) => [styles.close, pressed && { opacity: 0.65 }]}><Text style={styles.closeText}>×</Text></Pressable>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
      <View style={styles.counterBlock}><Text style={styles.questionIndex}>第 {index + 1} 题</Text><Text style={styles.counter}>{answerCounterLabel(correctCount, lesson.questions.length)}</Text></View>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: soundsEnabled }} accessibilityLabel={soundsEnabled ? "关闭闯关音效" : "开启闯关音效"} onPress={toggleSounds} style={styles.sound}><Text style={styles.soundText}>{soundsEnabled ? "🔊" : "🔇"}</Text></Pressable>
    </View>
    <View style={styles.scene}><View style={styles.sceneCopy}><Text style={styles.sceneTag}>{playfulScene}</Text><Text style={styles.lessonTitle}>{lesson.title}</Text><View style={styles.skillPill}><Text style={styles.skillPillText}>{skill.badge} · {skill.title}</Text></View></View><FeedbackRabbit state={rabbitState} size={60} /></View>
    <TransitionIn trigger={`${lesson.id}-${index}`}>
      <View style={styles.questionBox}><Text style={styles.helper}>{question.helper}</Text><Text style={styles.question}>{question.prompt}</Text></View>
      {question.skill === "meaning" ? <MeaningTask question={question} selected={selected} onSelect={selectAnswer} /> : null}
      {question.skill === "listening" ? <ListeningTask question={question} selected={selected} onSelect={selectAnswer} /> : null}
      {question.skill === "spelling" ? <SpellingTask word={spellingWord} missing={missing} selectedLetters={selectedText} options={question.options} selected={selected} onChoose={chooseLetter} onClear={clearSpelling} /> : null}
      {question.skill === "word-complete" ? <WordCompleteTask word={spellingWord} missing={missing} selectedLetters={selectedText} options={question.options} selected={selected} onChoose={chooseLetter} onClear={clearSpelling} /> : null}
      {question.skill === "context" ? <ContextTask question={question} selected={selected} onSelect={selectAnswer} /> : null}
      {question.skill === "speaking" ? <SpeakingTask targetText={question.targetText ?? ""} isRecording={grade.isRecording} isGrading={grade.isPending} partial={grade.partial} score={speakingScore} feedback={speakingFeedback} transcript={speakingTranscript} error={speakingError} onListen={() => speakEnglish(question.targetText ?? question.explanation, true)} onRecord={grade.isRecording ? stopAndGrade : startSpeaking} onComplete={completeSpeaking} completeLabel={speakingDoneLabel} /> : null}
      {selected ? <View style={[styles.feedback, isCorrect ? styles.goodFeedback : styles.retryFeedback]}>
      <Text style={[styles.feedbackTitle, isCorrect ? styles.goodFeedbackText : styles.retryFeedbackText]}>{isCorrect ? question.skill === "speaking" ? "勇敢开口，真棒！" : "答对啦！" : question.skill === "spelling" ? "再看看字母顺序" : "再记一次"}</Text>
      <Text style={styles.feedbackBody}>{question.skill === "speaking" && speakingScore !== null ? `${speakingFeedback} 识别到：${speakingTranscript || "继续保持"}` : isCorrect ? "兔兔为你收下一颗进步星。" : question.explanation}</Text>
      {isCorrect ? <View style={styles.autoNext}><Text style={styles.autoNextText}>{index === lesson.questions.length - 1 ? "马上结算通关星星…" : "答对啦，马上进入下一题…"}</Text></View> : <Pressable accessibilityRole="button" accessibilityLabel={index === lesson.questions.length - 1 ? "领取通关星星" : "进入下一题"} onPress={next} style={({ pressed }) => [styles.nextButton, pressed && { transform: [{ scale: 0.98 }] }]}><Text style={styles.nextText}>{index === lesson.questions.length - 1 ? "领取星星" : "下一题"}</Text></Pressable>}
      </View> : <Text style={styles.selectHint}>{skill.hint}。音效可在右上角关闭。</Text>}
    </TransitionIn>
  </ScrollView></ScreenContainer>;
}

function MeaningTask({ question, selected, onSelect }: { question: Question; selected: string | null; onSelect: (value: string) => void }) {
  return <View style={styles.taskArea}><View style={styles.wordBubble}><Text style={styles.wordBubbleText}>{question.wordId}</Text><Text style={styles.wordBubbleLabel}>选择最合适的中文意思</Text></View><View style={styles.options}>{question.options.map((option) => <OptionButton key={option} option={option} question={question} selected={selected} onSelect={onSelect} />)}</View></View>;
}

function ListeningTask({ question, selected, onSelect }: { question: Question; selected: string | null; onSelect: (value: string) => void }) {
  return <View style={styles.taskArea}><View style={styles.listeningCard}><Text style={styles.listeningIcon}>👂</Text><Text style={styles.listeningTitle}>兔兔读一读</Text><Text style={styles.listeningBody}>听清楚后，选出你听到的英文词。</Text><Pressable accessibilityRole="button" accessibilityLabel="播放单词示范" onPress={() => speakEnglish(question.targetText ?? question.answer, true)} style={({ pressed }) => [styles.listenButton, pressed && { opacity: 0.78 }]}><Text style={styles.listenButtonText}>🔊 再听一遍</Text></Pressable></View><View style={styles.options}>{question.options.map((option) => <OptionButton key={option} option={option} question={question} selected={selected} onSelect={onSelect} />)}</View></View>;
}

function SpellingTask({ word, missing, selectedLetters, options, selected, onChoose, onClear }: { word: string[]; missing: Set<number>; selectedLetters: string; options: string[]; selected: string | null; onChoose: (letter: string) => void; onClear: () => void }) {
  let missingCursor = 0;
  return <View style={styles.taskArea}><View style={styles.spellingRow}>{word.map((letter, index) => {
    if (!missing.has(index)) return <View key={`${letter}-${index}`} style={styles.letterCell}><Text style={styles.fixedLetter}>{letter.toUpperCase()}</Text></View>;
    const value = selectedLetters[missingCursor++] ?? "";
    return <View key={`${letter}-${index}`} style={[styles.letterCell, styles.blankLetter]}><Text style={styles.chosenLetter}>{value}</Text></View>;
  })}</View><Text style={styles.spellingHint}>点选字母，补齐单词</Text><View style={styles.letterOptions}>{options.map((letter, index) => <Pressable key={`${letter}-${index}`} accessibilityRole="button" accessibilityLabel={`选择字母 ${letter}`} disabled={Boolean(selected) || selectedLetters.length >= missing.size} onPress={() => onChoose(letter)} style={({ pressed }) => [styles.letterOption, (selected || selectedLetters.length >= missing.size) && styles.optionDisabled, pressed && !selected && { transform: [{ scale: 0.97 }] }]}><Text style={styles.letterOptionText}>{letter}</Text></Pressable>)}</View><Pressable accessibilityRole="button" accessibilityLabel="清除已选字母" disabled={Boolean(selected) || !selectedLetters} onPress={onClear} style={[styles.clearButton, (!selectedLetters || selected) && styles.clearDisabled]}><Text style={styles.clearText}>重选字母</Text></Pressable></View>;
}

function WordCompleteTask({ word, missing, selectedLetters, options, selected, onChoose, onClear }: { word: string[]; missing: Set<number>; selectedLetters: string; options: string[]; selected: string | null; onChoose: (letter: string) => void; onClear: () => void }) {
  return <View><View style={styles.wordCompleteBanner}><Text style={styles.wordCompleteIcon}>🎈</Text><View style={styles.wordCompleteCopy}><Text style={styles.wordCompleteTitle}>字母气球飘走啦！</Text><Text style={styles.wordCompleteBody}>从下面的字母篮里找一找，把单词补完整。</Text></View></View><SpellingTask word={word} missing={missing} selectedLetters={selectedLetters} options={options} selected={selected} onChoose={onChoose} onClear={onClear} /></View>;
}

function ContextTask({ question, selected, onSelect }: { question: Question; selected: string | null; onSelect: (value: string) => void }) {
  return <View style={styles.taskArea}><View style={styles.dialogueCard}><Text style={styles.dialogueSpeaker}>兔兔说</Text><Text style={styles.dialogueText}>{question.targetText}</Text></View><View style={styles.options}>{question.options.map((option) => <OptionButton key={option} option={option} question={question} selected={selected} onSelect={onSelect} />)}</View></View>;
}

function SpeakingTask({ targetText, isRecording, isGrading, partial, score, feedback, transcript, error, onListen, onRecord, onComplete, completeLabel }: { targetText: string; isRecording: boolean; isGrading: boolean; partial: string; score: number | null; feedback: string; transcript: string; error: string; onListen: () => void; onRecord: () => void; onComplete: () => void; completeLabel: string }) {
  return <View style={styles.taskArea}><View style={styles.speakingCard}><Text style={styles.speakingLabel}>示范句</Text><Text style={styles.speakingText}>{targetText}</Text><Pressable accessibilityRole="button" accessibilityLabel="慢速播放示范句" onPress={onListen} style={({ pressed }) => [styles.demoButton, pressed && { opacity: 0.75 }]}><Text style={styles.demoText}>🔊 先听一遍</Text></Pressable></View><Text style={styles.speakingSteps}>先听示范，再按大按钮朗读；评分不可用时也能继续。</Text><Pressable accessibilityRole="button" accessibilityLabel={isRecording ? "停止录音并评分" : "开始朗读录音"} disabled={isGrading} onPress={onRecord} style={({ pressed }) => [styles.recordButton, isRecording && styles.recording, isGrading && styles.recordDisabled, pressed && { transform: [{ scale: 0.98 }] }]}><Text style={styles.recordIcon}>{isGrading ? "…" : isRecording ? "■" : "●"}</Text><Text style={styles.recordText}>{isGrading ? "正在听你读…" : isRecording ? "读完了，停止评分" : "按这里，开始跟读"}</Text></Pressable>{isGrading ? <ActivityIndicator color="#F5803E" style={styles.loading} /> : null}{isRecording && partial ? <Text style={{ color: "#8A8178", fontSize: 12, fontStyle: "italic", marginTop: 8, textAlign: "center" }}>🎧 正在听：{partial}</Text> : null}{score !== null ? <View style={styles.scoreCard}><Text style={styles.scoreText}>{score}<Text style={styles.scoreUnit}> 分</Text></Text><Text style={styles.scoreFeedback}>{feedback}</Text><Text style={styles.transcript}>听到：{transcript || "继续大声读"}</Text></View> : null}{error ? <Text style={styles.speechError}>{error}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={completeLabel} disabled={isRecording || isGrading} onPress={onComplete} style={({ pressed }) => [styles.speakingComplete, (isRecording || isGrading) && styles.optionDisabled, pressed && { opacity: 0.8 }]}><Text style={styles.speakingCompleteText}>{completeLabel}</Text></Pressable></View>;
}

function OptionButton({ option, question, selected, onSelect }: { option: string; question: Question; selected: string | null; onSelect: (value: string) => void }) {
  const selectedThis = selected === option;
  const stateStyle = selected ? option === question.answer ? styles.correctOption : selectedThis ? styles.wrongOption : styles.dimOption : undefined;
  const textStyle = selected && option === question.answer ? styles.correctText : selectedThis && selected !== question.answer ? styles.wrongText : styles.optionText;
  return <Pressable accessibilityRole="button" accessibilityLabel={`选择答案 ${option}`} disabled={Boolean(selected)} onPress={() => onSelect(option)} style={({ pressed }) => [styles.option, stateStyle, pressed && !selected && { transform: [{ scale: 0.985 }], opacity: 0.94 }]}><Text style={textStyle}>{option}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, backgroundColor: "#FFF9F0" }, topbar: { flexDirection: "row", alignItems: "center", gap: 10 }, close: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#EEE5D9" }, closeText: { fontSize: 27, lineHeight: 30, color: "#746D65" }, progressTrack: { flex: 1, height: 11, borderRadius: 8, backgroundColor: "#E9E2D9", overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 8, backgroundColor: "#46A758" }, counterBlock: { alignItems: "flex-end", gap: 2 }, questionIndex: { color: "#847B71", fontSize: 10, fontWeight: "800" }, counter: { color: "#5C58B5", fontSize: 11, fontWeight: "900" }, sound: { width: 34, height: 34, backgroundColor: "#FFFFFF", borderRadius: 17, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#EEE5D9" }, soundText: { fontSize: 15 },
  scene: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 }, sceneCopy: { flex: 1, paddingRight: 10 }, sceneTag: { color: "#E06A22", fontSize: 12, fontWeight: "900" }, lessonTitle: { color: "#2E2A25", fontSize: 24, fontWeight: "900", marginTop: 5 }, skillPill: { alignSelf: "flex-start", backgroundColor: "#FFF0D7", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, marginTop: 8 }, skillPillText: { color: "#A75B1C", fontSize: 11, fontWeight: "900" }, questionBox: { marginTop: 24 }, helper: { color: "#8A8178", fontSize: 14, lineHeight: 20 }, question: { color: "#2E2A25", fontSize: 24, lineHeight: 32, fontWeight: "900", marginTop: 8 },
  taskArea: { marginTop: 20 }, wordBubble: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 15, borderWidth: 1, borderColor: "#F0EAE1" }, wordBubbleText: { color: "#5C58B5", fontSize: 28, fontWeight: "900" }, wordBubbleLabel: { color: "#857C73", fontSize: 12, marginTop: 5, fontWeight: "700" }, options: { marginTop: 15, gap: 10 }, option: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#E9E2D9", borderRadius: 18, minHeight: 54, paddingHorizontal: 18, justifyContent: "center" }, optionText: { color: "#36302B", fontSize: 16, fontWeight: "800" }, correctOption: { borderColor: "#46A758", backgroundColor: "#E3F7E8", transform: [{ scale: 1.01 }] }, wrongOption: { borderColor: "#D6595F", backgroundColor: "#FDE9E9" }, dimOption: { opacity: 0.53 }, correctText: { color: "#257739", fontSize: 16, fontWeight: "900" }, wrongText: { color: "#AD3D47", fontSize: 16, fontWeight: "900" }, optionDisabled: { opacity: 0.55 },
  listeningCard: { alignItems: "center", backgroundColor: "#EAF6FF", borderRadius: 21, padding: 18, borderWidth: 1, borderColor: "#CBE8FC" }, listeningIcon: { fontSize: 28 }, listeningTitle: { color: "#3676A3", fontSize: 17, fontWeight: "900", marginTop: 5 }, listeningBody: { color: "#5E7E93", fontSize: 12, marginTop: 5, textAlign: "center" }, listenButton: { marginTop: 13, backgroundColor: "#FFFFFF", borderRadius: 13, paddingHorizontal: 15, paddingVertical: 10 }, listenButtonText: { color: "#3676A3", fontSize: 13, fontWeight: "900" },
  spellingRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center", backgroundColor: "#FFFFFF", padding: 17, borderRadius: 21, borderWidth: 1, borderColor: "#F0EAE1" }, letterCell: { minWidth: 31, height: 39, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F1EA", paddingHorizontal: 4 }, blankLetter: { backgroundColor: "#FFF0D7", borderWidth: 1.5, borderColor: "#F4B15B" }, fixedLetter: { color: "#514A43", fontSize: 18, fontWeight: "900" }, chosenLetter: { color: "#C5661E", fontSize: 18, fontWeight: "900" }, spellingHint: { color: "#8A8178", textAlign: "center", fontSize: 12, marginTop: 10, fontWeight: "700" }, letterOptions: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 16 }, letterOption: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#E9E2D9", alignItems: "center", justifyContent: "center" }, letterOptionText: { color: "#4F4942", fontSize: 18, fontWeight: "900" }, clearButton: { alignSelf: "center", marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 }, clearDisabled: { opacity: 0.4 }, clearText: { color: "#8A8178", fontSize: 12, fontWeight: "800" },
  wordCompleteBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF1D3", borderRadius: 17, padding: 12, borderWidth: 1, borderColor: "#F5D18A" }, wordCompleteIcon: { fontSize: 26, marginRight: 9 }, wordCompleteCopy: { flex: 1 }, wordCompleteTitle: { color: "#A65B1B", fontSize: 14, fontWeight: "900" }, wordCompleteBody: { color: "#8C6842", fontSize: 11, lineHeight: 16, marginTop: 2, fontWeight: "700" },
  dialogueCard: { backgroundColor: "#F3EEFF", borderRadius: 21, padding: 18, borderWidth: 1, borderColor: "#E4D9FF" }, dialogueSpeaker: { color: "#6B58B2", fontSize: 12, fontWeight: "900" }, dialogueText: { color: "#443B63", fontSize: 20, lineHeight: 29, fontWeight: "900", marginTop: 7 },
  speakingCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F0EAE1", borderRadius: 21, padding: 18, alignItems: "center" }, speakingLabel: { color: "#6B58B2", fontSize: 12, fontWeight: "900" }, speakingText: { color: "#332D29", fontSize: 20, lineHeight: 29, fontWeight: "900", textAlign: "center", marginTop: 7 }, demoButton: { marginTop: 14, backgroundColor: "#F3EEFF", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10 }, demoText: { color: "#5C58B5", fontWeight: "900", fontSize: 13 }, speakingSteps: { color: "#81786F", fontSize: 12, lineHeight: 18, marginTop: 13, textAlign: "center" }, recordButton: { height: 62, marginTop: 17, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F5803E", flexDirection: "row", gap: 9 }, recording: { backgroundColor: "#D6595F" }, recordDisabled: { opacity: 0.62 }, recordIcon: { color: "#FFFFFF", fontSize: 18 }, recordText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, loading: { marginTop: 12 }, scoreCard: { backgroundColor: "#E7F6EB", borderRadius: 17, padding: 13, alignItems: "center", marginTop: 13 }, scoreText: { color: "#2D8441", fontSize: 30, fontWeight: "900" }, scoreUnit: { fontSize: 14 }, scoreFeedback: { color: "#397A4B", fontSize: 13, fontWeight: "800", marginTop: 3, textAlign: "center" }, transcript: { color: "#578061", fontSize: 12, marginTop: 7, textAlign: "center" }, speechError: { color: "#A65B1B", backgroundColor: "#FFF0D7", fontSize: 12, lineHeight: 18, padding: 12, borderRadius: 14, marginTop: 12 }, speakingComplete: { minHeight: ACTION_LAYOUT.secondaryMinHeight, justifyContent: "center", alignItems: "center", borderRadius: ACTION_LAYOUT.primaryRadius, backgroundColor: "#FFF0D7", marginTop: 12 }, speakingCompleteText: { color: "#A65B1B", fontSize: 13, fontWeight: "900" },
  selectHint: { color: "#A19A92", fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 17 }, feedback: { marginTop: 16, borderRadius: 20, padding: 17 }, goodFeedback: { backgroundColor: "#E3F7E8" }, retryFeedback: { backgroundColor: "#FFF0D7" }, feedbackTitle: { fontSize: 17, fontWeight: "900" }, goodFeedbackText: { color: "#257739" }, retryFeedbackText: { color: "#A65B1B" }, feedbackBody: { color: "#5F574F", fontSize: 14, lineHeight: 20, marginTop: 4 }, autoNext: { minHeight: ACTION_LAYOUT.primaryMinHeight, justifyContent: "center", backgroundColor: "#46A758", borderRadius: ACTION_LAYOUT.primaryRadius, paddingVertical: 12, alignItems: "center", marginTop: 14 }, autoNextText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, nextButton: { minHeight: ACTION_LAYOUT.primaryMinHeight, justifyContent: "center", backgroundColor: "#F5803E", borderRadius: ACTION_LAYOUT.primaryRadius, paddingVertical: 12, alignItems: "center", marginTop: 14 }, nextText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, error: { color: "#2E2A25", fontSize: 16, lineHeight: 24, textAlign: "center" },
});
