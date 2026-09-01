import { readFileSync, writeFileSync } from "node:fs";

const [uploadedPath, learningDataPath, extendedPath, materialPath, outputPath] = process.argv.slice(2);
if (![uploadedPath, learningDataPath, extendedPath, materialPath, outputPath].every(Boolean)) throw new Error("Usage: node compare-uploaded-vocabulary.mjs <uploaded> <learning-data> <extended> <material> <output>");

const normalizeWord = (value) => value
  .normalize("NFKC")
  .replace(/[’‘]/g, "'")
  .replace(/\s+/g, " ")
  .replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, "")
  .toLowerCase();

const extractMatches = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);
const sources = [
  { name: "course", words: extractMatches(readFileSync(learningDataPath, "utf8"), /word:\s*"([^"]+)"/g) },
  { name: "extended", words: extractMatches(readFileSync(extendedPath, "utf8"), /\["([^"]+)",\s*"/g) },
  { name: "previous-upload", words: extractMatches(readFileSync(materialPath, "utf8"), /word\("L[1-7]",\s*"([^"]+)"/g) },
];

const existing = new Map();
for (const source of sources) {
  for (const value of source.words) {
    const key = normalizeWord(value);
    if (!key) continue;
    const labels = existing.get(key) ?? [];
    if (!labels.includes(source.name)) labels.push(source.name);
    existing.set(key, labels);
  }
}

const aliases = new Map([
  ["colour", "color"], ["centre", "center"], ["favourite", "favorite"], ["travelling", "traveling"], ["programme", "program"], ["grey", "gray"],
]);
const uploaded = JSON.parse(readFileSync(uploadedPath, "utf8"));
const levelForGrade = { G1: "L1", G2: "L2", G3: "L3", G4: "L4", G5: "L5", G6: "L6", G7: "L7" };

const matchesExisting = [];
const matchesAlias = [];
const additions = [];
for (const item of uploaded.vocabulary ?? []) {
  const exact = existing.get(item.normalized);
  const alias = aliases.get(item.normalized);
  const aliasSources = alias ? existing.get(alias) : undefined;
  if (exact) {
    matchesExisting.push({ ...item, existingSources: exact });
  } else if (aliasSources) {
    matchesAlias.push({ ...item, canonicalExistingWord: alias, existingSources: aliasSources });
  } else {
    const word = item.forms[0];
    additions.push({ ...item, levelId: levelForGrade[item.grades[0]] ?? "L7", word, meaning: item.meanings[0] ?? "", example: item.examples?.[0] ?? `Let's learn ${word}.`, sourceUnit: `江苏题库·${item.themes[0] ?? "分级主题"}`, practice: "词义、拼写/听辨、语境、跟读" });
  }
}

const report = {
  uploadedNormalizedWords: uploaded.normalizedUniqueWords,
  existingWordCount: existing.size,
  exactDuplicateCount: matchesExisting.length,
  aliasDuplicateCount: matchesAlias.length,
  additionCount: additions.length,
  additionsByLevel: additions.reduce((result, item) => { result[item.levelId] = (result[item.levelId] ?? 0) + 1; return result; }, {}),
  exactDuplicates: matchesExisting,
  aliasDuplicates: matchesAlias,
  additions,
};

writeFileSync(outputPath, JSON.stringify(report, null, 2));
