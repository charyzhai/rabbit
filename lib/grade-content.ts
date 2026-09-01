import { shuffle } from "./learning-data";

export type GradeGuide = {
  id: string;
  title: string;
  stage: string;
  focus: string;
  color: string;
  modules: Array<{ title: string; topics: string; practice: string }>;
};

export type GrammarQuest = {
  id: string;
  grade: string;
  title: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type GrammarSet = { id: "daily" | "past" | "phonics"; grade: string; label: string; subtitle: string; quests: GrammarQuest[] };

export type ReadingItem = {
  id: string;
  kind: "quote" | "story";
  grades: string;
  title: string;
  titleZh: string;
  text: string;
  meaningZh: string;
  keyWords: string[];
};

export const GRADE_CONTENT_GUIDES: GradeGuide[] = [
  { id: "G1", title: "G1 一年级启蒙", stage: "听说·认读", focus: "问候、数字、颜色、家庭、食物、动物、动作与衣物。", color: "#F5803E", modules: [{ title: "开口第一句", topics: "Hello / Good morning / This is…", practice: "听辨与跟读" }, { title: "生活认读", topics: "水果、文具、玩具、颜色、农场动物", practice: "词图匹配" }, { title: "动起来", topics: "I can dance / Run! / Put on your coat", practice: "动作口令" }] },
  { id: "G2", title: "G2 二年级探索", stage: "听说·简单描述", focus: "家庭宠物、动物特征、季节食物、学校、职业、方位和身体。", color: "#F2B84B", modules: [{ title: "我的伙伴", topics: "She's my aunt / I have a rabbit / It has a tail", practice: "词义与描述" }, { title: "校园与家", topics: "Our school / Clean up / Where's…?", practice: "场景选择" }, { title: "四季出行", topics: "Autumn / Seasons / Going places", practice: "听辨与跟读" }] },
  { id: "G3", title: "G3 三年级基础", stage: "词汇·句型", focus: "课堂指令、方位、时间、农场、人物、食物与礼物。", color: "#46A758", modules: [{ title: "校园交流", topics: "Hello / In class / In the library", practice: "词义与对话" }, { title: "生活提问", topics: "Where's…? / How old…? / What time…?", practice: "语境补全" }, { title: "家庭农场", topics: "My family / On the farm / We're twins", practice: "拼写与跟读" }] },
  { id: "G4", title: "G4 四年级成长", stage: "表达·应用", focus: "动物喜好、数量能力、家居购物、课程、星期、四季和感受。", color: "#4A9FE8", modules: [{ title: "兴趣与能力", topics: "I like dogs / I can play basketball", practice: "拼写与句型" }, { title: "生活安排", topics: "Our school subjects / My day / Seasons", practice: "时间语境" }, { title: "关心他人", topics: "What's the matter? / How are you?", practice: "对话跟读" }] },
  { id: "G5", title: "G5 五年级进阶", stage: "语法·交流", focus: "故事、校园、爱好职业、交通问路、健康、节日和日期。", color: "#7B6FEA", modules: [{ title: "故事与描述", topics: "Goldilocks / Cinderella / there be", practice: "语法小站" }, { title: "真实交流", topics: "Hobbies / Jobs / Asking the way / Seeing the doctor", practice: "语境对话" }, { title: "节日计划", topics: "Chinese festivals / Birthdays", practice: "阅读与跟读" }] },
  { id: "G6", title: "G6 六年级衔接", stage: "读写·时态", focus: "过去故事、天气、环保、今昔、习惯、健康、安全、梦想和将来计划。", color: "#D85C87", modules: [{ title: "过去与现在", topics: "The king's new clothes / What a day / Then and now", practice: "时态填空" }, { title: "生活建议", topics: "Good habits / Healthy diet / Road safety", practice: "规则判断" }, { title: "未来的我", topics: "Summer holiday plans / Our dreams", practice: "句型应用" }] },
  { id: "G7", title: "G7 初一衔接", stage: "读写·系统语法", focus: "自我介绍、爱好、校园、作息、健康、服饰、理财和节日文化。", color: "#5B67CE", modules: [{ title: "校园新生活", topics: "This is me / Hobbies / Welcome to our school", practice: "阅读与表达" }, { title: "健康与风格", topics: "School days / Healthy lifestyle / My clothes", practice: "语法应用" }, { title: "生活决策", topics: "Be wise with money / Let's celebrate", practice: "语境与写作" }] },
];

const RAW_GRAMMAR_QUESTS: GrammarQuest[] = [
  { id: "g3-am", grade: "G3", title: "be 动词小台阶", prompt: "Hello, I ___ Amy.", options: ["am", "is", "are"], answer: "am", explanation: "I 后面用 am：I am，缩写为 I'm。" },
  { id: "g3-command", grade: "G3", title: "课堂小规则", prompt: "___ shout in the library!", options: ["Don't", "Doesn't", "Not"], answer: "Don't", explanation: "否定祈使句用 Don't + 动词原形。" },
  { id: "g4-any", grade: "G4", title: "水果沙拉", prompt: "Do you have ___ grapes?", options: ["any", "some", "a"], answer: "any", explanation: "一般疑问句中常用 any 表示“一些”。" },
  { id: "g4-can", grade: "G4", title: "能力展示", prompt: "Can you swim? — Yes, I ___.", options: ["can", "do", "am"], answer: "can", explanation: "Can 问句用 can 回答：Yes, I can." },
  { id: "g5-there-be", grade: "G5", title: "森林小屋", prompt: "There ___ three bears in the house.", options: ["are", "is", "am"], answer: "are", explanation: "three bears 是复数，所以用 There are。" },
  { id: "g5-doing", grade: "G5", title: "爱好分享", prompt: "I like ___ stories.", options: ["reading", "read", "reads"], answer: "reading", explanation: "like 后面接动词时常用动词 ing 形式。" },
  { id: "g5-because", grade: "G5", title: "说出原因", prompt: "Why are you tired? — ___ I played football.", options: ["Because", "But", "And"], answer: "Because", explanation: "Because 用来说明原因，意思是“因为”。" },
  { id: "g5-should", grade: "G5", title: "健康小医生", prompt: "You ___ have a rest.", options: ["should", "shoulds", "are"], answer: "should", explanation: "should 后面接动词原形，用来提出建议。" },
  { id: "g6-past", grade: "G6", title: "昨天的天气", prompt: "It ___ rainy yesterday.", options: ["was", "is", "are"], answer: "was", explanation: "yesterday 表示过去，单数 it 用 was。" },
  { id: "g6-must", grade: "G6", title: "道路安全", prompt: "You ___ wait for the green light.", options: ["must", "mustn't", "are"], answer: "must", explanation: "must 表示必须做的安全规则。" },
  { id: "g6-future", grade: "G6", title: "暑假计划", prompt: "I ___ going to visit Suzhou.", options: ["am", "is", "are"], answer: "am", explanation: "I am going to… 表示“我打算……”。" },
  { id: "g7-third-person", grade: "G7", title: "爱好小达人", prompt: "Tom ___ reading after school.", options: ["enjoys", "enjoy", "enjoying"], answer: "enjoys", explanation: "Tom 是第三人称单数，一般现在时动词加 -s。" },
  { id: "g7-some-any", grade: "G7", title: "健康午餐", prompt: "We need ___ vegetables.", options: ["some", "any", "an"], answer: "some", explanation: "肯定句中常用 some 表示“一些”。" },
  { id: "g7-preposition", grade: "G7", title: "学校日常", prompt: "Our school starts ___ eight.", options: ["at", "on", "in"], answer: "at", explanation: "具体时间点前用 at。" },
];

const RAW_PAST_TENSE_QUESTS: GrammarQuest[] = [
  { id: "past-was", grade: "G6", title: "昨天的天气", prompt: "It ___ rainy yesterday.", options: ["was", "is", "are"], answer: "was", explanation: "yesterday 表示过去；it 是单数，所以用 was。" },
  { id: "past-were", grade: "G6", title: "快乐的周末", prompt: "We ___ happy last weekend.", options: ["were", "are", "was"], answer: "were", explanation: "we 是复数，在过去时中用 were。" },
  { id: "past-went", grade: "G6", title: "公园探险", prompt: "I ___ to the park yesterday.", options: ["went", "go", "goes"], answer: "went", explanation: "go 的过去式是 went，用来讲已经发生的事。" },
  { id: "past-saw", grade: "G6", title: "看见小鸟", prompt: "We ___ a bird in the tree.", options: ["saw", "see", "sees"], answer: "saw", explanation: "see 的过去式是 saw。" },
  { id: "past-did", grade: "G6", title: "作业时间", prompt: "She ___ her homework last night.", options: ["did", "does", "do"], answer: "did", explanation: "do 的过去式是 did。" },
  { id: "past-time", grade: "G6", title: "时光侦探", prompt: "Which word tells us about the past?", options: ["yesterday", "tomorrow", "now"], answer: "yesterday", explanation: "yesterday 是“昨天”，它提醒我们用过去时。" },
];

const RAW_PHONICS_TERM_QUESTS: GrammarQuest[] = [
  { id: "phonics-sound", grade: "G7", title: "听见声音", prompt: "A letter can make a ___.", options: ["sound", "planet", "festival"], answer: "sound", explanation: "sound 是“声音、发音”，字母可以发出不同的声音。" },
  { id: "phonics-vowel", grade: "G7", title: "元音小伙伴", prompt: "Which letter is a vowel?", options: ["A", "B", "T"], answer: "A", explanation: "A、E、I、O、U 是常见的元音字母。" },
  { id: "phonics-consonant", grade: "G7", title: "辅音小伙伴", prompt: "Which letter is a consonant?", options: ["B", "E", "I"], answer: "B", explanation: "B 是辅音字母；E 和 I 是元音字母。" },
  { id: "phonics-syllable", grade: "G7", title: "音节拍手", prompt: "How many syllables are in “rabbit”?", options: ["two", "one", "three"], answer: "two", explanation: "rab-bit 可以拍两下，所以有两个音节。" },
  { id: "phonics-stress", grade: "G7", title: "重音在哪里", prompt: "Stress tells us which part to say ___.", options: ["stronger", "slower", "smaller"], answer: "stronger", explanation: "重音部分会读得更重、更清楚一些。" },
  { id: "phonics-letter", grade: "G7", title: "字母和声音", prompt: "A, B and C are ___.", options: ["letters", "sentences", "planets"], answer: "letters", explanation: "letter 是“字母”，多个字母是 letters。" },
];

/** 打乱每个选项顺序，让正确答案不再固定出现在第一个。 */
export const GRAMMAR_QUESTS: GrammarQuest[] = RAW_GRAMMAR_QUESTS.map((q) => ({ ...q, options: shuffle(q.options) }));
export const PAST_TENSE_QUESTS: GrammarQuest[] = RAW_PAST_TENSE_QUESTS.map((q) => ({ ...q, options: shuffle(q.options) }));
export const PHONICS_TERM_QUESTS: GrammarQuest[] = RAW_PHONICS_TERM_QUESTS.map((q) => ({ ...q, options: shuffle(q.options) }));

export const GRAMMAR_SETS: GrammarSet[] = [
  { id: "daily", grade: "G3—G7", label: "每日小练", subtitle: "语法小站综合题", quests: GRAMMAR_QUESTS },
  { id: "past", grade: "G6", label: "过去时侦探", subtitle: "was / were / went / saw / did", quests: PAST_TENSE_QUESTS },
  { id: "phonics", grade: "G7", label: "音标术语", subtitle: "sound / vowel / syllable / stress", quests: PHONICS_TERM_QUESTS },
];

export const DAILY_READINGS: ReadingItem[] = [
  { id: "quote-g1-can", kind: "quote", grades: "G1–G2", title: "I can do it.", titleZh: "我能做到。", text: "I can do it.", meaningZh: "遇到新单词和新挑战时，先勇敢试一试。", keyWords: ["can", "do"] },
  { id: "quote-g1-kind", kind: "quote", grades: "G1–G2", title: "Be kind.", titleZh: "要善良。", text: "Be kind. Share and care.", meaningZh: "学会分享，也学会关心身边的人。", keyWords: ["kind", "share", "care"] },
  { id: "quote-g3-practice", kind: "quote", grades: "G3–G4", title: "Practice makes perfect.", titleZh: "熟能生巧。", text: "Practice makes perfect.", meaningZh: "每天练一点，慢慢就会越来越熟练。", keyWords: ["practice", "perfect"] },
  { id: "quote-g3-time", kind: "quote", grades: "G3–G4", title: "Time is money.", titleZh: "时间就是金钱。", text: "Time is money.", meaningZh: "珍惜学习时间，完成小目标。", keyWords: ["time", "money"] },
  { id: "quote-g5-knowledge", kind: "quote", grades: "G5–G6", title: "Knowledge is power.", titleZh: "知识就是力量。", text: "Knowledge is power.", meaningZh: "通过阅读和思考获得力量。", keyWords: ["knowledge", "power"] },
  { id: "quote-g5-actions", kind: "quote", grades: "G5–G6", title: "Actions speak louder than words.", titleZh: "行动胜于言辞。", text: "Actions speak louder than words.", meaningZh: "说到做到，用行动证明自己。", keyWords: ["actions", "speak", "words"] },
  { id: "quote-g7-step", kind: "quote", grades: "G7", title: "A single step.", titleZh: "千里之行，始于足下。", text: "The journey of a thousand miles begins with a single step.", meaningZh: "再大的目标，也从眼前的一小步开始。", keyWords: ["journey", "begins", "step"] },
  { id: "quote-g7-hope", kind: "quote", grades: "G7", title: "Where there is life, there is hope.", titleZh: "有生命就有希望。", text: "Where there is life, there is hope.", meaningZh: "保持希望，继续学习和成长。", keyWords: ["life", "hope"] },
  { id: "story-red-hen", kind: "story", grades: "G1–G2", title: "The Little Red Hen", titleZh: "小红母鸡", text: "The little red hen found some wheat. She asked for help to plant it, cut it and make bread. No one helped. The hen made the bread. She ate it herself.", meaningZh: "小红母鸡自己种麦、割麦、做面包。故事提醒我们：自己的事自己做。", keyWords: ["hen", "wheat", "bread", "plant", "make"] },
  { id: "story-three-pigs", kind: "story", grades: "G3–G4", title: "The Three Little Pigs", titleZh: "三只小猪", text: "Three little pigs built three houses. One house was straw. One was sticks. One was bricks. The wolf blew the first two houses down, but the brick house was strong.", meaningZh: "三只小猪用不同材料盖房，砖房最坚固。故事告诉我们：认真踏实才有好结果。", keyWords: ["pig", "straw", "sticks", "bricks", "strong"] },
  { id: "story-lion-mouse", kind: "story", grades: "G5–G6", title: "The Lion and the Mouse", titleZh: "狮子和老鼠", text: "A large lion caught a small mouse, but let it go. Later the lion was in a net. The mouse bit the net and set the lion free. A small friend can help a large friend.", meaningZh: "狮子放过小老鼠，后来小老鼠救了狮子。故事告诉我们：每个人都能帮助别人。", keyWords: ["lion", "mouse", "net", "bite", "free"] },
  { id: "story-tortoise-hare", kind: "story", grades: "G7", title: "The Tortoise and the Hare", titleZh: "龟兔赛跑", text: "A hare laughed at a slow tortoise. They had a race. The hare ran fast and slept. The tortoise walked slowly but never stopped. The tortoise won the race.", meaningZh: "兔子骄傲睡觉，乌龟不停前进并获胜。故事告诉我们：稳步坚持更重要。", keyWords: ["tortoise", "hare", "slow", "fast", "race"] },
];

export const getGradeGuide = (grade: string) => GRADE_CONTENT_GUIDES.find((item) => item.id === grade);
export const getGrammarQuest = (index: number) => GRAMMAR_QUESTS[index % GRAMMAR_QUESTS.length];
export const getReadingById = (id: string) => DAILY_READINGS.find((item) => item.id === id);
