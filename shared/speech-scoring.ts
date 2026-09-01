export const normalizeSpeechText = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();

const levenshteinDistance = (source: string, target: string) => {
  const matrix = Array.from({ length: source.length + 1 }, (_, index) => [index]);
  for (let index = 0; index <= target.length; index += 1) matrix[0][index] = index;
  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      matrix[row][column] = source[row - 1] === target[column - 1]
        ? matrix[row - 1][column - 1]
        : Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + 1);
    }
  }
  return matrix[source.length][target.length];
};

export const calculatePronunciationScore = (targetText: string, transcript: string) => {
  const target = normalizeSpeechText(targetText);
  const spoken = normalizeSpeechText(transcript);
  if (!target || !spoken) return { score: 0, target, spoken, feedback: "没有识别到清晰的英文内容，请靠近麦克风再试一次。" };
  const distance = levenshteinDistance(target, spoken);
  const score = Math.max(0, Math.min(100, Math.round((1 - distance / Math.max(target.length, spoken.length)) * 100)));
  const feedback = score >= 90 ? "读得很准确，继续保持！" : score >= 70 ? "读得不错，试着把每个词读得更清楚。" : "已识别到部分内容，建议先听示范，再放慢速度跟读。";
  return { score, target, spoken, feedback };
};
