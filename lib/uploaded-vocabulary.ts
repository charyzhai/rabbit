import { JIANGSU_QUESTION_BANK_ADDITIONS } from "./jiangsu-question-bank-vocabulary";

export type UploadedMaterialWord = {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  levelId: string;
  sourceUnit: string;
  practice: string;
};

const word = (levelId: string, value: string, meaning: string, example: string, sourceUnit: string, practice: string): UploadedMaterialWord => ({ id: value.toLowerCase(), word: value, phonetic: "", meaning, example, levelId, sourceUnit, practice });

/** 去重后从用户上传的《星宝英语·单词总表》融入的30个新增材料词。 */
export const UPLOADED_VOCABULARY_ADDITIONS: UploadedMaterialWord[] = [
  word("L1", "hi", "嗨", "Hi, I’m Ben.", "问候", "听辨、词义、跟读"),
  word("L1", "bye", "再见", "Bye, Mum!", "问候", "听辨、词义、跟读"),
  word("L2", "kite", "风筝", "I have a kite.", "玩具乐园", "词义、听辨、语境"),
  word("L2", "game", "游戏", "Let’s play a game.", "玩具乐园", "词义、听辨、语境"),
  word("L2", "peach", "桃", "The peach is sweet.", "水果乐园", "词义、听辨、跟读"),
  word("L3", "lamp", "台灯", "The lamp is on the desk.", "我的房间", "词义、拼写、语境"),
  word("L3", "driver", "司机", "My uncle is a driver.", "职业启蒙", "词义、拼写、语境"),
  word("L4", "policeman", "警察", "The policeman helps us.", "梦想职业", "词义、拼写、跟读"),
  word("L4", "fruit", "水果", "Fruit is good for us.", "健康习惯", "词义、拼写、语境"),
  word("L5", "Christmas", "圣诞节", "We have a gift at Christmas.", "节日", "词义、拼写、阅读"),
  word("L6", "was", "是（过去式）", "It was sunny yesterday.", "过去时", "语法、语境、跟读"),
  word("L6", "were", "是（过去式）", "They were at home.", "过去时", "语法、语境、跟读"),
  word("L6", "went", "去（过去式）", "I went to the park.", "过去时", "语法、拼写、语境"),
  word("L6", "saw", "看见（过去式）", "We saw a bird.", "过去时", "语法、拼写、语境"),
  word("L6", "did", "做（过去式）", "She did her homework.", "过去时", "语法、拼写、语境"),
  word("L6", "space", "太空", "Space is very big.", "科学", "词义、拼写、阅读"),
  word("L6", "planet", "行星", "Earth is a planet.", "科学", "词义、拼写、阅读"),
  word("L7", "sound", "发音", "Listen to the sound.", "音标复习", "词义、跟读、语法"),
  word("L7", "vowel", "元音", "A is a vowel.", "音标复习", "词义、拼写、语法"),
  word("L7", "consonant", "辅音", "B is a consonant.", "音标复习", "词义、拼写、语法"),
  word("L7", "syllable", "音节", "Rabbit has two syllables.", "音标复习", "词义、拼写、语法"),
  word("L7", "stress", "重音", "The stress is on the first syllable.", "音标复习", "词义、跟读、语法"),
  word("L7", "noun", "名词", "A noun can name a thing.", "基础语法", "词义、拼写、语法"),
  word("L7", "verb", "动词", "Run is a verb.", "基础语法", "词义、拼写、语法"),
  word("L7", "adjective", "形容词", "Happy is an adjective.", "基础语法", "词义、拼写、语法"),
  word("L7", "tense", "时态", "Past tense tells about before.", "基础语法", "词义、语境、语法"),
  word("L7", "greeting", "问候", "Hello is a greeting.", "短对话", "词义、拼写、跟读"),
  word("L7", "introduce", "介绍", "Let me introduce my friend.", "短对话", "词义、拼写、语境"),
  word("L7", "ask", "询问", "Please ask your teacher.", "短对话", "词义、拼写、语境"),
  word("L7", "daily life", "日常生活", "English is useful in daily life.", "短对话", "词义、语境、阅读"),
];

/** 包含此前融合词与本次江苏G1—G7题库去重后新增词的完整材料词库。 */
export const ALL_UPLOADED_MATERIAL_WORDS: UploadedMaterialWord[] = [...UPLOADED_VOCABULARY_ADDITIONS, ...JIANGSU_QUESTION_BANK_ADDITIONS];

export const getUploadedWordsForLevel = (levelId: string) => ALL_UPLOADED_MATERIAL_WORDS.filter((item) => item.levelId === levelId);
