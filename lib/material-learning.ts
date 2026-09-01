import { shuffle } from "./learning-data";

export const MATERIAL_WORD_BATCH_SIZE = 12;

type MaterialWordLike = { sourceUnit: string; word: string };

export const sortMaterialWords = <T extends MaterialWordLike>(items: T[]) => [...items].sort((left, right) => {
  const byTheme = left.sourceUnit.localeCompare(right.sourceUnit, "zh-Hans-CN");
  return byTheme || left.word.localeCompare(right.word, "en");
});

export const getMaterialBatchCount = (totalWords: number, batchSize = MATERIAL_WORD_BATCH_SIZE) => Math.max(1, Math.ceil(totalWords / batchSize));

export const getMaterialWordBatch = <T extends MaterialWordLike>(items: T[], batchIndex: number, batchSize = MATERIAL_WORD_BATCH_SIZE) => {
  const safeIndex = Math.max(0, Math.min(batchIndex, getMaterialBatchCount(items.length, batchSize) - 1));
  return sortMaterialWords(items).slice(safeIndex * batchSize, safeIndex * batchSize + batchSize);
};

export const getMaterialBatchProgress = (completedWords: number, totalWords: number) => {
  const total = Math.max(0, totalWords);
  const completed = Math.max(0, Math.min(completedWords, total));
  return {
    currentWord: total ? Math.min(completed + 1, total) : 0,
    completedWords: completed,
    remainingWords: Math.max(0, total - completed),
    percentage: total ? Math.round((completed / total) * 100) : 0,
  };
};

export const getMaterialBatchCompletionAction = (batchIndex: number, batchCount: number) => batchIndex < Math.max(0, batchCount - 1) ? "continue" as const : "review" as const;

const BATCH_BADGE_ICONS = ["🥕", "🎈", "🌟", "🧩", "🚀", "🏆"];

export const getMaterialBatchBadge = (levelId: string, batchIndex: number) => ({
  id: `${levelId}:batch-${batchIndex + 1}`,
  icon: BATCH_BADGE_ICONS[batchIndex % BATCH_BADGE_ICONS.length],
  title: `${levelId} 第${batchIndex + 1}组小勇士`,
  stars: 1,
});

/** 返回第一个尚未完成的分组；全部完成时回到第1组，供复练入口使用。 */
export const getNextMaterialBatchIndex = (levelId: string, totalWords: number, materialBatchBadges: Record<string, unknown>) => {
  const batchCount = getMaterialBatchCount(totalWords);
  return Array.from({ length: batchCount }, (_, batchIndex) => batchIndex).find((batchIndex) => !materialBatchBadges[getMaterialBatchBadge(levelId, batchIndex).id]) ?? 0;
};

export type BunnyMicroStory = { levelId: string; title: string; theme: string; body: string; focusWords: string[] };

export const BUNNY_MICRO_STORIES: BunnyMicroStory[] = [
  { levelId: "L1", title: "兔兔的彩虹书包", theme: "校园与问候", body: "Bunny has a new bag. A red ball is in the bag. “Hello!” says Bunny. A little bird says, “Hi!”", focusWords: ["a", "bag", "red", "hello"] },
  { levelId: "L2", title: "兔兔的周末野餐", theme: "动物与食物", body: "Bunny puts apples in a basket. A small bee visits the picnic. “Be careful,” says Bunny. Then they share a cake.", focusWords: ["basket", "bee", "be careful", "cake"] },
  { levelId: "L3", title: "兔兔的校园地图", theme: "校园与方位", body: "After school, Bunny looks at the school map. The art room is near the library. Bunny puts a blue cap in the bag and goes there with a friend.", focusWords: ["after school", "art room", "near", "cap"] },
  { levelId: "L4", title: "兔兔的小镇午餐", theme: "日常与点餐", body: "Bunny meets a friend after school. They walk to a small snack bar. “Anything else?” asks the waitress. Bunny smiles and chooses orange juice.", focusWords: ["after school", "anything else", "snack bar", "orange juice"] },
  { levelId: "L5", title: "兔兔的美术室钥匙", theme: "校园与帮助", body: "Bunny cannot find the art room key. A policewoman helps Bunny ask the way. At last, Bunny sees the key under a poster and says thank you.", focusWords: ["art room", "ask the way", "policewoman", "poster"] },
  { levelId: "L6", title: "兔兔的太空花园", theme: "健康与科学", body: "Bunny grows a little space garden. There are a few green plants. Bunny waters them every day and writes a report about the new planet.", focusWords: ["a little", "a few", "space", "planet"] },
  { levelId: "L7", title: "兔兔的梦想小镇", theme: "能力与成长", body: "Bunny wants to improve an old town garden. With practice and ability, Bunny is able to build a bridge above the stream. Everyone smiles at the new place.", focusWords: ["ability", "able", "above", "build"] },
];

export const getBunnyMicroStory = (levelId: string) => BUNNY_MICRO_STORIES.find((story) => story.levelId === levelId);

export const getStoryCloze = (story: BunnyMicroStory) => {
  const answer = story.focusWords[story.focusWords.length - 1];
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { answer, prompt: story.body.replace(new RegExp(escaped, "i"), "____"), options: shuffle(story.focusWords) };
};

export const getStorySentences = (story: BunnyMicroStory) => story.body.split(/(?<=[.!?])\s+(?=[A-Z])/u).map((sentence) => sentence.trim()).filter(Boolean);
