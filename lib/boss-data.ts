import { getLessonsForLevel, shuffle, type LessonSkill } from "./learning-data";

export type BossChallenge = { id: string; skill: "meaning" | "word" | "context" | "speaking"; prompt: string; helper: string; options: string[]; answer: string; targetText?: string; explanation: string };

export const getBossChallenges = (levelId: string): BossChallenge[] => {
  const lessons = getLessonsForLevel(levelId);
  const pick = (index: number) => lessons[Math.min(index, lessons.length - 1)];
  const meaning = pick(0).questions[0];
  const wordLesson = pick(2);
  const wordTarget = wordLesson.targets[1] ?? wordLesson.targets[0];
  const context = pick(4).questions[2];
  const speaking = pick(6).questions[3];
  const wordOptions = shuffle([wordTarget.word, ...wordLesson.targets.filter((item) => item.word !== wordTarget.word).slice(0, 2).map((item) => item.word)]);
  return [
    { id: `${levelId}-boss-meaning`, skill: "meaning", prompt: `“${meaning.wordId}” 是什么意思？`, helper: `来自 ${pick(0).title}`, options: meaning.options, answer: meaning.answer, explanation: meaning.explanation },
    { id: `${levelId}-boss-word`, skill: "word", prompt: `选出表示“${wordTarget.meaning}”的英文词`, helper: `来自 ${wordLesson.title}`, options: wordOptions, answer: wordTarget.word, targetText: wordTarget.word, explanation: `${wordTarget.word}：${wordTarget.meaning}。${wordTarget.example}` },
    { id: `${levelId}-boss-context`, skill: "context", prompt: context.prompt, helper: `来自 ${pick(4).title}`, options: context.options, answer: context.answer, targetText: context.targetText, explanation: context.explanation },
    { id: `${levelId}-boss-speaking`, skill: "speaking", prompt: "听一听，完成等级跟读挑战", helper: `来自 ${pick(6).title}`, options: [], answer: "完成", targetText: speaking.targetText, explanation: speaking.explanation },
  ];
};

export const bossSkillLabel = (skill: BossChallenge["skill"] | LessonSkill) => ({ meaning: "词义", word: "词汇", context: "语境", speaking: "跟读", listening: "听辨", spelling: "拼写", "word-complete": "补词", grammar: "语法" }[skill] ?? "挑战");
