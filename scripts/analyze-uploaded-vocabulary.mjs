import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = "/home/ubuntu/upload/pasted_file_t4GlTc_1.md";
const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");
const aliases = new Map([
  ["noodle", "noodles"], ["drawing", "draw"], ["singing", "sing"], ["dancing", "dance"],
]);
const canonical = (value) => aliases.get(normalize(value)) ?? normalize(value);

const uploaded = [];
let levelId = "";
let inWords = false;
for (const line of fs.readFileSync(source, "utf8").split(/\r?\n/)) {
  const level = line.match(/^## L(\d)\b/);
  if (level) { levelId = `L${level[1]}`; inWords = false; continue; }
  if (line.startsWith("###")) { inWords = false; continue; }
  if (line.trim() === "|英文|中文|所属单元|") { inWords = true; continue; }
  if (!inWords || !line.startsWith("|") || line.includes("---")) continue;
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length === 3 && cells[0]) uploaded.push({ levelId, word: cells[0], meaning: cells[1], unit: cells[2] });
}

const existingSources = ["lib/learning-data.ts", "lib/extended-vocabulary.ts"];
const existing = new Set();
for (const relative of existingSources) {
  const text = fs.readFileSync(path.join(root, relative), "utf8");
  for (const match of text.matchAll(/word:\s*"([^"]+)"/g)) existing.add(canonical(match[1]));
  for (const match of text.matchAll(/\["([^"]+)",\s*"[^"]+"\]/g)) existing.add(canonical(match[1]));
}

const seenUpload = new Set();
const additions = [];
const existingRows = [];
for (const item of uploaded) {
  const key = canonical(item.word);
  if (existing.has(key) || seenUpload.has(key)) existingRows.push({ ...item, normalized: key });
  else { seenUpload.add(key); additions.push({ ...item, normalized: key }); }
}

const report = {
  source: path.basename(source),
  uploadedCount: uploaded.length,
  matchedExistingCount: existingRows.length,
  newCount: additions.length,
  additionsByLevel: Object.fromEntries(Array.from({ length: 7 }, (_, index) => { const level = `L${index + 1}`; return [level, additions.filter((item) => item.levelId === level)]; })),
  duplicatesOrExisting: existingRows,
};
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "uploaded-vocabulary-dedup.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ uploaded: report.uploadedCount, existingOrDuplicate: report.matchedExistingCount, additions: report.newCount, byLevel: Object.fromEntries(Object.entries(report.additionsByLevel).map(([level, rows]) => [level, rows.length])) }, null, 2));
