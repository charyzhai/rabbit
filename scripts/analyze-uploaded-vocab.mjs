import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error("Usage: node analyze-uploaded-vocab.mjs <input> <output>");

const normalizeWord = (value) => value
  .normalize("NFKC")
  .replace(/[’‘]/g, "'")
  .replace(/\s+/g, " ")
  .replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, "")
  .toLowerCase();

const rawPayload = readFileSync(inputPath, "utf8").trim();
let payload;
try {
  payload = JSON.parse(rawPayload);
} catch {
  payload = JSON.parse(`${rawPayload}\n}`);
}
const words = new Map();
let totalEntries = 0;

const appearsInSentence = (word, sentence) => {
  if (word.length <= 2) return false;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(sentence);
};

for (const unit of payload.units ?? []) {
  for (const item of unit.vocab ?? []) {
    const normalized = normalizeWord(item.en ?? "");
    if (!normalized) continue;
    totalEntries += 1;
    const current = words.get(normalized) ?? {
      normalized,
      forms: [],
      meanings: [],
      grades: [],
      themes: [],
      units: [],
      types: [],
      examples: [],
    };
    if (!current.forms.includes(item.en)) current.forms.push(item.en);
    if (item.zh && !current.meanings.includes(item.zh)) current.meanings.push(item.zh);
    if (unit.grade && !current.grades.includes(unit.grade)) current.grades.push(unit.grade);
    if (unit.theme && !current.themes.includes(unit.theme)) current.themes.push(unit.theme);
    const unitRef = `${unit.grade ?? ""}-${unit.book ?? ""}-U${unit.unit ?? ""}`;
    if (!current.units.includes(unitRef)) current.units.push(unitRef);
    if (item.type && !current.types.includes(item.type)) current.types.push(item.type);
    const matchingSentence = (unit.sentences ?? []).find((sentence) => appearsInSentence(normalized, sentence));
    if (matchingSentence && !current.examples.includes(matchingSentence)) current.examples.push(matchingSentence);
    words.set(normalized, current);
  }
}

const vocabulary = [...words.values()].sort((a, b) => a.normalized.localeCompare(b.normalized));
const countBy = (getKey) => vocabulary.reduce((result, item) => {
  for (const key of getKey(item)) result[key] = (result[key] ?? 0) + 1;
  return result;
}, {});

const report = {
  meta: payload.meta,
  totalVocabEntries: totalEntries,
  normalizedUniqueWords: vocabulary.length,
  duplicateEntriesInsideUpload: totalEntries - vocabulary.length,
  uniqueWordsByGrade: countBy((item) => item.grades),
  uniqueWordsByType: countBy((item) => item.types),
  vocabulary,
};

writeFileSync(outputPath, JSON.stringify(report, null, 2));
