import { readFileSync, writeFileSync } from "node:fs";

const [comparePath, examplesPath, outputPath] = process.argv.slice(2);
if (![comparePath, examplesPath, outputPath].every(Boolean)) throw new Error("Usage: apply-natural-examples.mjs <compare> <examples> <output>");

const compare = JSON.parse(readFileSync(comparePath, "utf8"));
const generated = JSON.parse(readFileSync(examplesPath, "utf8")).examples ?? {};

const fallbackExample = (item) => {
  const word = item.word;
  if (item.levelId === "L1" || item.levelId === "L2") return `I can say ${word}.`;
  if (item.levelId === "L3" || item.levelId === "L4") return `We use ${word} at school.`;
  return `We can use ${word} in our story.`;
};

const additions = compare.additions.map((item) => ({
  ...item,
  example: generated[item.normalized] ?? (item.example.startsWith("Let's learn ") ? fallbackExample(item) : item.example),
}));

writeFileSync(outputPath, JSON.stringify({ ...compare, additions }, null, 2));
