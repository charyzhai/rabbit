import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error("Usage: node generate-jiangsu-vocabulary.mjs <compare-json> <output-ts>");

const payload = JSON.parse(readFileSync(inputPath, "utf8"));
const escape = (value) => JSON.stringify(value ?? "");
const rows = (payload.additions ?? []).map((item) => `  { id: ${escape(item.normalized)}, word: ${escape(item.word)}, phonetic: "", meaning: ${escape(item.meaning)}, example: ${escape(item.example)}, levelId: ${escape(item.levelId)}, sourceUnit: ${escape(item.sourceUnit)}, practice: ${escape(item.practice)} },`);

const source = `/**\n * 从用户上传的江苏小学英语 G1—G7 闯关题库中规范化去重后保留的新增材料词。\n * 自动生成：源题库 1,039 个规范化词，跳过与现有课程、扩展库及既有材料词重复的词。\n */\nexport type JiangsuQuestionBankWord = {\n  id: string;\n  word: string;\n  phonetic: string;\n  meaning: string;\n  example: string;\n  levelId: string;\n  sourceUnit: string;\n  practice: string;\n};\n\nexport const JIANGSU_QUESTION_BANK_ADDITIONS: JiangsuQuestionBankWord[] = [\n${rows.join("\n")}\n];\n`;

writeFileSync(outputPath, source);
