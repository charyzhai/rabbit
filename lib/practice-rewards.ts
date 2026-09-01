export type PronunciationReward = { stars: 0 | 1 | 2 | 3; title: string; message: string };

export const getPronunciationReward = (rawScore: number): PronunciationReward => {
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  if (score >= 90) return { stars: 3, title: "发音小明星！", message: "节奏清楚、发音很准，收下3颗星吧！" };
  if (score >= 75) return { stars: 2, title: "说得真不错！", message: "再把个别单词读清楚一点，就能冲3颗星。" };
  if (score >= 60) return { stars: 1, title: "勇敢开口！", message: "已经完成跟读，听一遍示范后再挑战吧。" };
  return { stars: 0, title: "再听一次示范", message: "慢一点读也没关系，兔兔陪你再练一遍。" };
};
