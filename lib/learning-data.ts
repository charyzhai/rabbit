import { EXTENDED_REVIEW_WORDS } from "./extended-vocabulary";
import { ALL_UPLOADED_MATERIAL_WORDS } from "./uploaded-vocabulary";

/** 不修改入参的 Fisher-Yates 洗牌，用于把正确答案打散到随机位置。 */
export const shuffle = <T>(list: readonly T[]): T[] => {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export type LearningLevel = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  wordCount: number;
  description: string;
};

export type VocabularyTarget = {
  word: string;
  meaning: string;
  example: string;
};

export type LessonSkill = "meaning" | "listening" | "spelling" | "word-complete" | "context" | "speaking" | "grammar";

export type Question = {
  id: string;
  skill: LessonSkill;
  prompt: string;
  helper: string;
  options: string[];
  answer: string;
  explanation: string;
  wordId?: string;
  targetText?: string;
  missingLetters?: number[];
};

export type Lesson = {
  id: string;
  levelId: string;
  title: string;
  scene: string;
  description: string;
  rewardStars: number;
  estimatedMinutes: number;
  targetWords: string[];
  targets: VocabularyTarget[];
  questions: Question[];
};

export type ReviewWord = {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  levelId: string;
};

type CourseSeed = Omit<Lesson, "targetWords" | "questions">;

export const LEVELS: LearningLevel[] = [
  { id: "L1", title: "G1 兔兔启蒙", subtitle: "听说与认读", color: "#F5803E", icon: "🐇", wordCount: 70, description: "开口说第一句英语" },
  { id: "L2", title: "G2 萝卜探索", subtitle: "描述与生活", color: "#F2B84B", icon: "🥕", wordCount: 145, description: "认识身边熟悉的事物" },
  { id: "L3", title: "G3 校园小镇", subtitle: "基础词汇与句型", color: "#46A758", icon: "🏫", wordCount: 230, description: "在校园和小镇完成任务" },
  { id: "L4", title: "G4 四季小径", subtitle: "表达与应用", color: "#4A9FE8", icon: "🌦️", wordCount: 315, description: "用英语安排每天的生活" },
  { id: "L5", title: "G5 成长森林", subtitle: "语法与交流", color: "#7B6FEA", icon: "🌲", wordCount: 410, description: "学会表达想法和计划" },
  { id: "L6", title: "G6 世界车站", subtitle: "读写与时态", color: "#D85C87", icon: "🧭", wordCount: 505, description: "带着英语探索更大的世界" },
  { id: "L7", title: "G7 星光中学", subtitle: "初一衔接", color: "#5B67CE", icon: "✨", wordCount: 755, description: "为初一英语做好准备" },
];

const PLAYFUL_SCENE_LABELS: Record<string, string> = {
  "校园入口": "🌈 早晨的彩虹校园入口", "美术角": "🎨 彩虹涂色小画室", "数字站台": "🚂 数字小火车站", "运动角": "🏃 兔兔运动能量站",
  "动物园": "🦁 动物朋友欢唱园", "学校餐厅": "🍎 香喷喷的午餐花园", "家门口": "☔ 雨滴跳跳的家门口", "家里": "🏠 温暖的兔兔小家",
  "教室": "🏫 叮铃铃的阳光教室", "操场": "⚽ 风筝飞飞的操场", "校园地图": "🗺️ 校园寻宝地图岛", "小镇餐厅": "🍜 兔兔小镇美食铺",
  "卧室": "🌙 星星晚安小卧室", "四季小径": "🌷 四季变装小径", "农场": "🥕 胡萝卜香香农场", "公交站": "🚌 出发吧公交站",
  "三只熊的家": "🐻 森林小屋故事站", "动物观察角": "🔭 动物侦探观察角", "班级活动角": "🎤 闪亮兴趣舞台", "家庭介绍墙": "🧩 家庭职业拼图墙",
  "童话舞会": "👑 水晶鞋童话舞会", "家到学校": "🚲 上学冒险路线", "街道地图": "🚦 小镇问路探险图", "派对准备间": "🎂 彩旗生日派对间",
  "童话剧场": "🎭 金色童话剧场", "天气观察站": "🌦️ 云朵天气观察站", "博物馆大厅": "🏛️ 标志小侦探大厅", "新春市集": "🏮 红火新春市集",
};

export const getPlayfulSceneLabel = (scene: string) => PLAYFUL_SCENE_LABELS[scene] ?? `🐇 兔兔探险站 · ${scene}`;

const seed = (id: string, levelId: string, title: string, scene: string, description: string, targets: VocabularyTarget[], rewardStars = 3): CourseSeed => ({
  id,
  levelId,
  title,
  scene,
  description,
  rewardStars,
  estimatedMinutes: 4,
  targets,
});

const COURSE_SEEDS: CourseSeed[] = [
  seed("l1-hello", "L1", "你好，兔兔同学", "校园入口", "认识新朋友，说出第一句问候。", [{ word: "hello", meaning: "你好", example: "Hello, I’m Amy." }, { word: "name", meaning: "名字", example: "What’s your name?" }, { word: "friend", meaning: "朋友", example: "He is my friend." }, { word: "teacher", meaning: "老师", example: "Hello, teacher." }, { word: "please", meaning: "请", example: "Sit down, please." }, { word: "thank you", meaning: "谢谢你", example: "Thank you, Ben." }]),
  seed("l1-rainbow", "L1", "彩虹教室", "美术角", "给教室里的物品涂上正确颜色。", [{ word: "red", meaning: "红色", example: "It is red." }, { word: "blue", meaning: "蓝色", example: "My bag is blue." }, { word: "yellow", meaning: "黄色", example: "The sun is yellow." }, { word: "green", meaning: "绿色", example: "The leaf is green." }, { word: "black", meaning: "黑色", example: "The pen is black." }, { word: "white", meaning: "白色", example: "The rabbit is white." }]),
  seed("l1-numbers", "L1", "数字小火车", "数字站台", "按顺序给火车车厢排队。", [{ word: "one", meaning: "一", example: "One red apple." }, { word: "two", meaning: "二", example: "Two small dogs." }, { word: "three", meaning: "三", example: "Three blue balls." }, { word: "four", meaning: "四", example: "Four books." }, { word: "five", meaning: "五", example: "Five stars." }, { word: "six", meaning: "六", example: "Six pencils." }]),
  seed("l1-body", "L1", "身体动一动", "运动角", "听懂身体部位和简单动作。", [{ word: "head", meaning: "头", example: "Touch your head." }, { word: "hand", meaning: "手", example: "Raise your hand." }, { word: "eye", meaning: "眼睛", example: "I have two eyes." }, { word: "jump", meaning: "跳", example: "I can jump." }, { word: "stand", meaning: "站立", example: "Stand up, please." }, { word: "sit", meaning: "坐", example: "Sit down, please." }]),

  seed("l2-animals", "L2", "动物朋友会", "动物园", "认识动物，并说出自己的喜好。", [{ word: "cat", meaning: "猫", example: "I like cats." }, { word: "dog", meaning: "狗", example: "The dog is cute." }, { word: "rabbit", meaning: "兔子", example: "The rabbit can jump." }, { word: "panda", meaning: "熊猫", example: "The panda is black and white." }, { word: "bird", meaning: "鸟", example: "The bird can sing." }, { word: "zoo", meaning: "动物园", example: "Let’s go to the zoo." }]),
  seed("l2-lunch", "L2", "兔兔的午餐盒", "学校餐厅", "说出自己喜欢的食物和饮品。", [{ word: "apple", meaning: "苹果", example: "I like apples." }, { word: "milk", meaning: "牛奶", example: "I drink milk." }, { word: "bread", meaning: "面包", example: "This bread is nice." }, { word: "rice", meaning: "米饭", example: "I have rice for lunch." }, { word: "juice", meaning: "果汁", example: "I’d like some juice." }, { word: "hungry", meaning: "饥饿的", example: "I’m hungry." }]),
  seed("l2-rainy", "L2", "雨天出发", "家门口", "根据天气选择合适物品。", [{ word: "rainy", meaning: "下雨的", example: "It is rainy today." }, { word: "umbrella", meaning: "雨伞", example: "Take an umbrella." }, { word: "coat", meaning: "外套", example: "Wear your coat." }, { word: "cold", meaning: "寒冷的", example: "It is cold outside." }, { word: "sunny", meaning: "晴朗的", example: "It is sunny today." }, { word: "weather", meaning: "天气", example: "How is the weather?" }]),
  seed("l2-home", "L2", "我的小房间", "家里", "认识家中房间和常见物品。", [{ word: "home", meaning: "家", example: "Welcome to my home." }, { word: "bedroom", meaning: "卧室", example: "My bedroom is small." }, { word: "kitchen", meaning: "厨房", example: "Mum is in the kitchen." }, { word: "bed", meaning: "床", example: "The cat is on the bed." }, { word: "table", meaning: "桌子", example: "The book is on the table." }, { word: "window", meaning: "窗户", example: "Open the window, please." }]),

  seed("l3-timetable", "L3", "校园课程表", "教室", "说出喜欢的课程与上课时间。", [{ word: "English", meaning: "英语", example: "I like English." }, { word: "Maths", meaning: "数学", example: "We have Maths today." }, { word: "art", meaning: "美术", example: "Art is fun." }, { word: "lesson", meaning: "课", example: "Our lesson starts at nine." }, { word: "timetable", meaning: "课程表", example: "Look at the timetable." }, { word: "morning", meaning: "早晨", example: "We have English in the morning." }]),
  seed("l3-club", "L3", "兴趣社团日", "操场", "介绍自己的爱好和能力。", [{ word: "swim", meaning: "游泳", example: "I can swim." }, { word: "dance", meaning: "跳舞", example: "She can dance." }, { word: "football", meaning: "足球", example: "I play football." }, { word: "hobby", meaning: "爱好", example: "Reading is my hobby." }, { word: "club", meaning: "社团", example: "Join our music club." }, { word: "team", meaning: "队伍", example: "We are a team." }]),
  seed("l3-map", "L3", "校园寻宝图", "校园地图", "用英语找到图书馆和操场。", [{ word: "library", meaning: "图书馆", example: "The library is quiet." }, { word: "park", meaning: "公园", example: "The park is near here." }, { word: "next to", meaning: "紧挨着", example: "It is next to the park." }, { word: "turn", meaning: "转弯", example: "Turn left here." }, { word: "straight", meaning: "直走", example: "Go straight." }, { word: "map", meaning: "地图", example: "Look at the map." }]),
  seed("l3-restaurant", "L3", "餐厅点单", "小镇餐厅", "看菜单、点餐并询问价格。", [{ word: "menu", meaning: "菜单", example: "Here is the menu." }, { word: "noodles", meaning: "面条", example: "I’d like noodles." }, { word: "price", meaning: "价格", example: "What is the price?" }, { word: "order", meaning: "点单", example: "Are you ready to order?" }, { word: "delicious", meaning: "美味的", example: "The soup is delicious." }, { word: "yuan", meaning: "元", example: "It is ten yuan." }]),

  seed("l4-routine", "L4", "早晨时间表", "卧室", "说出自己的作息时间。", [{ word: "morning", meaning: "早晨", example: "I get up in the morning." }, { word: "early", meaning: "早的", example: "I get up early." }, { word: "late", meaning: "晚的", example: "Don’t be late." }, { word: "clock", meaning: "时钟", example: "The clock is on the wall." }, { word: "breakfast", meaning: "早餐", example: "I have breakfast at seven." }, { word: "homework", meaning: "家庭作业", example: "I do my homework." }]),
  seed("l4-seasons", "L4", "四季衣橱", "四季小径", "根据季节和天气选择衣物。", [{ word: "spring", meaning: "春天", example: "Spring is warm." }, { word: "summer", meaning: "夏天", example: "Summer is hot." }, { word: "autumn", meaning: "秋天", example: "Autumn is cool." }, { word: "winter", meaning: "冬天", example: "Winter is cold." }, { word: "season", meaning: "季节", example: "What is your favourite season?" }, { word: "snow", meaning: "雪", example: "It can snow in winter." }]),
  seed("l4-farm", "L4", "绿色农场", "农场", "认识农场动物和新鲜蔬菜。", [{ word: "farm", meaning: "农场", example: "We visit a farm." }, { word: "cow", meaning: "奶牛", example: "The cow gives milk." }, { word: "tomato", meaning: "西红柿", example: "The tomato is red." }, { word: "carrot", meaning: "胡萝卜", example: "The rabbit likes carrots." }, { word: "farmer", meaning: "农民", example: "The farmer works hard." }, { word: "fresh", meaning: "新鲜的", example: "The vegetables are fresh." }]),
  seed("l4-safety", "L4", "旅行安全卡", "公交站", "学习出行物品和安全提醒。", [{ word: "ticket", meaning: "票", example: "I have a bus ticket." }, { word: "bus", meaning: "公交车", example: "We go by bus." }, { word: "careful", meaning: "小心的", example: "Be careful on the road." }, { word: "safety", meaning: "安全", example: "Safety comes first." }, { word: "rule", meaning: "规则", example: "Follow the rules." }, { word: "station", meaning: "车站", example: "The station is over there." }]),

  seed("l5-chores", "L5", "家庭小帮手", "家里", "用英语安排家务并表达责任。", [{ word: "clean", meaning: "打扫", example: "I clean my room." }, { word: "tidy", meaning: "整理", example: "Keep your desk tidy." }, { word: "dishes", meaning: "盘子", example: "I wash the dishes." }, { word: "sweep", meaning: "扫", example: "Sweep the floor." }, { word: "share", meaning: "分享", example: "We share the work." }, { word: "together", meaning: "一起", example: "We do it together." }]),
  seed("l5-health", "L5", "健康小诊所", "健康角", "说出身体感受并给出简单建议。", [{ word: "healthy", meaning: "健康的", example: "Fruit is healthy." }, { word: "headache", meaning: "头痛", example: "I have a headache." }, { word: "rest", meaning: "休息", example: "You should have a rest." }, { word: "doctor", meaning: "医生", example: "See a doctor." }, { word: "exercise", meaning: "运动", example: "Exercise every day." }, { word: "sleep", meaning: "睡觉", example: "I sleep early." }]),
  seed("l5-festival", "L5", "灯笼节日会", "社区广场", "介绍传统节日和家庭活动。", [{ word: "festival", meaning: "节日", example: "The Spring Festival is important." }, { word: "lantern", meaning: "灯笼", example: "The lantern is red." }, { word: "mooncake", meaning: "月饼", example: "We eat mooncakes." }, { word: "celebrate", meaning: "庆祝", example: "We celebrate together." }, { word: "traditional", meaning: "传统的", example: "It is a traditional food." }, { word: "invite", meaning: "邀请", example: "I invite my friend." }]),
  seed("l5-green", "L5", "地球守护队", "环保站", "用英语提出简单环保行动。", [{ word: "recycle", meaning: "回收利用", example: "Recycle paper." }, { word: "plastic", meaning: "塑料", example: "Use less plastic." }, { word: "energy", meaning: "能源", example: "Save energy." }, { word: "earth", meaning: "地球", example: "Protect the earth." }, { word: "reduce", meaning: "减少", example: "Reduce rubbish." }, { word: "reuse", meaning: "再利用", example: "Reuse your bottle." }]),

  seed("l6-weather-news", "L6", "校园天气播报", "新闻角", "读懂天气信息并给出出行建议。", [{ word: "forecast", meaning: "预报", example: "Check the forecast." }, { word: "temperature", meaning: "温度", example: "The temperature is 20 degrees." }, { word: "warning", meaning: "预警", example: "Read the weather warning." }, { word: "windy", meaning: "有风的", example: "It is windy today." }, { word: "cloudy", meaning: "多云的", example: "It is cloudy." }, { word: "storm", meaning: "暴风雨", example: "A storm is coming." }], 4),
  seed("l6-city", "L6", "城市导览员", "城市中心", "给游客介绍城市地点和路线。", [{ word: "museum", meaning: "博物馆", example: "The museum is interesting." }, { word: "subway", meaning: "地铁", example: "Take the subway." }, { word: "entrance", meaning: "入口", example: "The entrance is here." }, { word: "gallery", meaning: "美术馆", example: "Visit the art gallery." }, { word: "theatre", meaning: "剧院", example: "The theatre is busy." }, { word: "tourist", meaning: "游客", example: "The tourist needs help." }], 4),
  seed("l6-travel", "L6", "苏州周末旅行", "旅行计划", "比较交通方案，做出更合适的选择。", [{ word: "journey", meaning: "旅程", example: "The train journey is short." }, { word: "hotel", meaning: "酒店", example: "We book a hotel." }, { word: "choose", meaning: "选择", example: "Choose a safe plan." }, { word: "faster", meaning: "更快的", example: "The metro is faster." }, { word: "luggage", meaning: "行李", example: "My luggage is light." }, { word: "guide", meaning: "导游/指南", example: "The guide helps us." }], 4),
  seed("l6-reading", "L6", "书店小项目", "书店", "用英语谈论故事、作者与阅读想法。", [{ word: "author", meaning: "作者", example: "Who is the author?" }, { word: "story", meaning: "故事", example: "The story is funny." }, { word: "discuss", meaning: "讨论", example: "Discuss the book." }, { word: "character", meaning: "角色", example: "The rabbit is a character." }, { word: "chapter", meaning: "章节", example: "Read Chapter One." }, { word: "title", meaning: "标题", example: "What is the title?" }], 4),

  seed("l7-campus", "L7", "星光中学报到日", "初一校园", "用英语介绍新学校和喜欢的学科。", [{ word: "grade", meaning: "年级", example: "I am in Grade Seven." }, { word: "geography", meaning: "地理", example: "Geography is my favourite subject." }, { word: "borrow", meaning: "借", example: "May I borrow this book?" }, { word: "classmate", meaning: "同班同学", example: "He is my classmate." }, { word: "hall", meaning: "大厅", example: "Meet in the hall." }, { word: "uniform", meaning: "校服", example: "Our uniform is blue." }], 5),
  seed("l7-routine", "L7", "新学期作息", "新家与新学校", "用频率表达描述一天的生活。", [{ word: "routine", meaning: "日常惯例", example: "This is my daily routine." }, { word: "toothbrush", meaning: "牙刷", example: "I need my toothbrush." }, { word: "breakfast", meaning: "早餐", example: "I have breakfast at seven." }, { word: "weekday", meaning: "工作日", example: "I study on weekdays." }, { word: "usually", meaning: "通常", example: "I usually walk to school." }, { word: "sometimes", meaning: "有时", example: "I sometimes read at night." }], 5),
  seed("l7-sports", "L7", "社团招新海报", "社团中心", "介绍兴趣、团队和练习安排。", [{ word: "interest", meaning: "兴趣", example: "Music is my interest." }, { word: "chess", meaning: "国际象棋", example: "I play chess." }, { word: "team", meaning: "团队", example: "Our team practises." }, { word: "practice", meaning: "练习", example: "We practise twice a week." }, { word: "coach", meaning: "教练", example: "The coach is kind." }, { word: "invitation", meaning: "邀请", example: "Here is an invitation." }], 5),
  seed("l7-digital", "L7", "聪明使用网络", "数字教室", "学习设备与网络安全表达。", [{ word: "website", meaning: "网站", example: "This website is useful." }, { word: "password", meaning: "密码", example: "Keep your password safe." }, { word: "safe", meaning: "安全的", example: "Stay safe online." }, { word: "device", meaning: "设备", example: "This device is new." }, { word: "source", meaning: "来源", example: "Check the source." }, { word: "privacy", meaning: "隐私", example: "Protect your privacy." }], 5),

  seed("l1-friends", "L1", "我的好朋友", "新同学见面", "介绍朋友，分清 he 和 she。", [{ word: "friend", meaning: "朋友", example: "She is my friend." }, { word: "he", meaning: "他", example: "He is my friend." }, { word: "she", meaning: "她", example: "She is my friend." }, { word: "sister", meaning: "姐姐或妹妹", example: "This is my sister." }]),
  seed("l1-family", "L1", "家庭相册", "家里", "用英语介绍最亲近的家人。", [{ word: "family", meaning: "家庭", example: "This is my family." }, { word: "father", meaning: "爸爸", example: "This is my father." }, { word: "mother", meaning: "妈妈", example: "This is my mother." }, { word: "brother", meaning: "哥哥或弟弟", example: "This is my brother." }]),
  seed("l1-snack", "L1", "点心时间", "教室分享角", "礼貌地接受或拒绝小点心。", [{ word: "cake", meaning: "蛋糕", example: "Would you like a cake?" }, { word: "ice cream", meaning: "冰淇淋", example: "I like ice cream." }, { word: "sweet", meaning: "糖果", example: "This sweet is nice." }, { word: "hot dog", meaning: "热狗", example: "I would like a hot dog." }]),
  seed("l1-new-year", "L1", "新年礼物盒", "新年聚会", "认出礼物并送上新年祝福。", [{ word: "doll", meaning: "玩偶", example: "This doll is for you." }, { word: "ball", meaning: "球", example: "This is a red ball." }, { word: "robot", meaning: "机器人", example: "I have a robot." }, { word: "car", meaning: "小汽车", example: "The car is new." }]),

  seed("l2-classroom", "L2", "课堂小指令", "英语教室", "听懂老师的指令并做出动作。", [{ word: "stand up", meaning: "起立", example: "Stand up, please." }, { word: "sit down", meaning: "坐下", example: "Sit down, please." }, { word: "open", meaning: "打开", example: "Open the book." }, { word: "close", meaning: "关上", example: "Close the door." }]),
  seed("l2-library", "L2", "图书馆规则", "学校图书馆", "学会用英语提醒大家轻声慢走。", [{ word: "shout", meaning: "喊叫", example: "Don't shout here." }, { word: "run", meaning: "跑", example: "Don't run here." }, { word: "eat", meaning: "吃", example: "Don't eat here." }, { word: "talk", meaning: "说话", example: "Don't talk here." }]),
  seed("l2-position", "L2", "小鸟在哪里", "教室寻鸟", "用方位词描述小鸟的位置。", [{ word: "bird", meaning: "鸟", example: "The bird is beautiful." }, { word: "under", meaning: "在下面", example: "It is under the desk." }, { word: "on", meaning: "在上面", example: "It is on the chair." }, { word: "behind", meaning: "在后面", example: "It is behind the tree." }]),
  seed("l2-farm-visit", "L2", "农场小导游", "开心农场", "认识农场动物，回答这些和那些是什么。", [{ word: "pig", meaning: "猪", example: "They are pigs." }, { word: "cow", meaning: "奶牛", example: "Those are cows." }, { word: "chicken", meaning: "鸡", example: "These are chickens." }, { word: "duck", meaning: "鸭子", example: "They are ducks." }]),

  seed("l3-fruit-salad", "L3", "水果沙拉派对", "厨房活动桌", "准备水果，邀请同伴一起制作沙拉。", [{ word: "pineapple", meaning: "菠萝", example: "I have a pineapple." }, { word: "mango", meaning: "芒果", example: "The mango is sweet." }, { word: "banana", meaning: "香蕉", example: "I like bananas." }, { word: "grape", meaning: "葡萄", example: "These grapes are nice." }]),
  seed("l3-stickers", "L3", "贴纸数一数", "奖励墙", "数清13到19的贴纸数量。", [{ word: "thirteen", meaning: "十三", example: "I have thirteen stickers." }, { word: "fifteen", meaning: "十五", example: "Fifteen stars are here." }, { word: "sixteen", meaning: "十六", example: "I can see sixteen balls." }, { word: "eighteen", meaning: "十八", example: "There are eighteen cards." }]),
  seed("l3-snack-bar", "L3", "小吃店点餐", "兔兔小吃吧", "读懂菜单，礼貌地点一份食物。", [{ word: "hamburger", meaning: "汉堡", example: "I'd like a hamburger." }, { word: "noodles", meaning: "面条", example: "I'd like noodles." }, { word: "sandwich", meaning: "三明治", example: "This sandwich is big." }, { word: "juice", meaning: "果汁", example: "A cup of juice, please." }]),
  seed("l3-dolls", "L3", "玩偶造型师", "玩具工作室", "描述玩偶的五官和外貌。", [{ word: "hair", meaning: "头发", example: "Her hair is long." }, { word: "eyes", meaning: "眼睛", example: "His eyes are big." }, { word: "nose", meaning: "鼻子", example: "Its nose is small." }, { word: "mouth", meaning: "嘴", example: "Her mouth is small." }]),

  seed("l4-subjects", "L4", "新学期课程表", "校园走廊", "说出自己喜欢的课程。", [{ word: "Chinese", meaning: "语文", example: "I like Chinese." }, { word: "Maths", meaning: "数学", example: "Maths is fun." }, { word: "Music", meaning: "音乐", example: "We have Music today." }, { word: "PE", meaning: "体育", example: "I like PE." }]),
  seed("l4-days", "L4", "放学后约一约", "校门口", "根据星期安排朋友间的活动。", [{ word: "Wednesday", meaning: "星期三", example: "It is Wednesday." }, { word: "Saturday", meaning: "星期六", example: "We play on Saturday." }, { word: "Sunday", meaning: "星期日", example: "Sunday is fun." }, { word: "Tuesday", meaning: "星期二", example: "We have a match on Tuesday." }]),
  seed("l4-my-day", "L4", "我的一天", "作息时间轴", "把一天的活动放到合适的时间。", [{ word: "get up", meaning: "起床", example: "I get up at seven." }, { word: "have lunch", meaning: "吃午饭", example: "I have lunch at twelve." }, { word: "play football", meaning: "踢足球", example: "I play football after school." }, { word: "homework", meaning: "家庭作业", example: "I do my homework at night." }]),
  seed("l4-feelings", "L4", "关心好朋友", "教室休息角", "表达不舒服的感受并送上关心。", [{ word: "thirsty", meaning: "口渴的", example: "I am thirsty." }, { word: "ill", meaning: "生病的", example: "She is ill." }, { word: "tired", meaning: "疲劳的", example: "He is tired." }, { word: "happy", meaning: "快乐的", example: "We are happy." }]),

  seed("l5-goldilocks", "L5", "森林小屋故事", "三只熊的家", "用 there be 描述小屋里的物品。", [{ word: "bear", meaning: "熊", example: "There are three bears." }, { word: "forest", meaning: "森林", example: "The house is in the forest." }, { word: "house", meaning: "房子", example: "There is a house." }, { word: "soup", meaning: "汤", example: "The soup is hot." }]),
  seed("l5-animal-friends", "L5", "动物朋友档案", "动物观察角", "描述动物的身体特征。", [{ word: "leg", meaning: "腿", example: "It has four legs." }, { word: "arm", meaning: "手臂", example: "It has two arms." }, { word: "wing", meaning: "翅膀", example: "The bird has wings." }, { word: "rabbit", meaning: "兔子", example: "The rabbit has long ears." }]),
  seed("l5-hobbies", "L5", "兴趣分享会", "班级活动角", "说出自己喜欢做的事情。", [{ word: "read", meaning: "阅读", example: "I like reading." }, { word: "dance", meaning: "跳舞", example: "She likes dancing." }, { word: "sing", meaning: "唱歌", example: "We like singing." }, { word: "hobby", meaning: "爱好", example: "Reading is my hobby." }]),
  seed("l5-jobs", "L5", "职业猜猜看", "家庭介绍墙", "认识家人的职业并准确介绍。", [{ word: "teacher", meaning: "教师", example: "My mother is a teacher." }, { word: "doctor", meaning: "医生", example: "His father is a doctor." }, { word: "nurse", meaning: "护士", example: "The nurse is kind." }, { word: "cook", meaning: "厨师", example: "She is a cook." }]),

  seed("l6-cinderella", "L6", "灰姑娘的选择", "童话舞会", "用 because 说出故事人物的原因。", [{ word: "prince", meaning: "王子", example: "The prince is kind." }, { word: "fairy", meaning: "仙女", example: "The fairy helps her." }, { word: "because", meaning: "因为", example: "I am sad because I am late." }, { word: "clothes", meaning: "衣服", example: "She puts on new clothes." }]),
  seed("l6-transport", "L6", "上学交通卡", "家到学校", "选择合适的上学交通方式。", [{ word: "bus", meaning: "公交车", example: "I come by bus." }, { word: "metro", meaning: "地铁", example: "She comes by metro." }, { word: "taxi", meaning: "出租车", example: "We go by taxi." }, { word: "bike", meaning: "自行车", example: "He rides a bike." }]),
  seed("l6-asking-way", "L6", "城市问路员", "街道地图", "给游客指一条清晰又安全的路。", [{ word: "get on", meaning: "上车", example: "Get on the bus." }, { word: "get off", meaning: "下车", example: "Get off at the station." }, { word: "turn right", meaning: "右转", example: "Turn right at the light." }, { word: "hospital", meaning: "医院", example: "The hospital is on your right." }]),
  seed("l6-birthday", "L6", "生日派对日历", "派对准备间", "读懂月份和日期，送上生日祝福。", [{ word: "April", meaning: "四月", example: "My birthday is in April." }, { word: "March", meaning: "三月", example: "March is a spring month." }, { word: "July", meaning: "七月", example: "July is hot." }, { word: "eighth", meaning: "第八", example: "It is on the eighth of April." }]),

  seed("l7-king-clothes", "L7", "国王的新装", "童话剧场", "用过去时词汇复述一个有趣的故事。", [{ word: "king", meaning: "国王", example: "Long long ago, there was a king." }, { word: "queen", meaning: "王后", example: "The queen was kind." }, { word: "clever", meaning: "聪明的", example: "The boy was clever." }, { word: "foolish", meaning: "愚蠢的", example: "The king was foolish." }], 5),
  seed("l7-weather-day", "L7", "多变的一天", "天气观察站", "用过去时说出早晚不同的天气。", [{ word: "sunny", meaning: "晴朗的", example: "It was sunny in the morning." }, { word: "cloudy", meaning: "多云的", example: "It was cloudy at noon." }, { word: "rainy", meaning: "下雨的", example: "It was rainy in the afternoon." }, { word: "windy", meaning: "有风的", example: "It was windy in the evening." }], 5),
  seed("l7-signs", "L7", "标志小侦探", "博物馆大厅", "读懂公共场所的安全和文明标志。", [{ word: "No smoking", meaning: "禁止吸烟", example: "It means you can't smoke." }, { word: "No littering", meaning: "禁止乱扔", example: "It means keep the floor clean." }, { word: "No parking", meaning: "禁止停车", example: "It means you can't park here." }, { word: "wet floor", meaning: "小心地滑", example: "Be careful. The floor is wet." }], 5),
  seed("l7-new-year", "L7", "春节计划册", "新春市集", "用 going to 说出自己的春节计划。", [{ word: "red packet", meaning: "红包", example: "I am going to get a red packet." }, { word: "lion dance", meaning: "舞狮", example: "We are going to watch a lion dance." }, { word: "fireworks", meaning: "烟花", example: "We are going to watch fireworks." }, { word: "dragon", meaning: "龙", example: "I am going to make a dragon." }], 5),
];

const spellingIndexes = (word: string) => {
  const letterIndexes = word.split("").flatMap((letter, index) => /[a-z]/i.test(letter) ? [index] : []);
  const total = word.replace(/[^a-z]/gi, "").length;
  const hiddenCount = total >= 8 ? 2 : 1;
  return letterIndexes.filter((_, index) => index % Math.max(1, Math.floor(letterIndexes.length / hiddenCount)) === 1).slice(0, hiddenCount);
};

const makeSpellingOptions = (word: string, missing: number[]) => {
  const required = missing.map((index) => word[index].toUpperCase());
  const fillers = ["A", "E", "I", "O", "U", "R", "T", "N", "S", "L", "M", "P"].filter((letter) => !required.includes(letter));
  const needed = Math.max(4, required.length + 2);
  const chosenFillers = shuffle(fillers).slice(0, needed - required.length);
  return shuffle([...required, ...chosenFillers]);
};

const blankSentence = (target: VocabularyTarget) => {
  const replaced = target.example.replace(new RegExp(target.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "____");
  return replaced === target.example ? `选择合适的词：____（${target.example}）` : replaced;
};

const makeQuestions = (lesson: CourseSeed): Question[] => {
  const [meaningTarget, spellingTarget, contextTarget, speakingTarget, reinforcementMeaningTarget = meaningTarget, reinforcementContextTarget = contextTarget] = lesson.targets;
  const sceneLabel = getPlayfulSceneLabel(lesson.scene);
  const choicesFor = (target: VocabularyTarget, field: "word" | "meaning") => shuffle([target[field], ...lesson.targets.filter((candidate) => candidate.word !== target.word).slice(0, 2).map((candidate) => candidate[field])]);
  const missingLetters = spellingIndexes(spellingTarget.word);
  const completionMissingLetters = spellingIndexes(reinforcementMeaningTarget.word);

  const earlyListening = lesson.levelId === "L1" || lesson.levelId === "L2";
  const skillQuestion: Question = earlyListening ? {
    id: `${lesson.id}-listening`, skill: "listening", prompt: "先听兔兔读单词，再选出来", helper: `${sceneLabel} · 听音选词`, options: choicesFor(spellingTarget, "word"), answer: spellingTarget.word, explanation: `听到的是 ${spellingTarget.word}，意思是“${spellingTarget.meaning}”。`, wordId: spellingTarget.word, targetText: spellingTarget.word,
  } : {
    id: `${lesson.id}-spelling`, skill: "spelling", prompt: "帮兔兔补齐单词里的字母", helper: `${sceneLabel} · 拼写小工坊`, options: makeSpellingOptions(spellingTarget.word, missingLetters), answer: missingLetters.map((index) => spellingTarget.word[index].toUpperCase()).join(""), explanation: `${spellingTarget.word} 的意思是“${spellingTarget.meaning}”。${spellingTarget.example}`, wordId: spellingTarget.word, targetText: spellingTarget.word, missingLetters,
  };

  const coreQuestions: Question[] = [
    {
      id: `${lesson.id}-meaning`, skill: "meaning", prompt: `“${meaningTarget.word}” 是什么意思？`, helper: `${sceneLabel} · 词义小卡`, options: choicesFor(meaningTarget, "meaning"), answer: meaningTarget.meaning, explanation: `${meaningTarget.word}：${meaningTarget.meaning}。${meaningTarget.example}`, wordId: meaningTarget.word,
    },
    skillQuestion,
    {
      id: `${lesson.id}-context`, skill: "context", prompt: `在${lesson.scene}，哪一个词最合适？`, helper: "场景对话 · 选词补全", options: choicesFor(contextTarget, "word"), answer: contextTarget.word, explanation: `完整句子：${contextTarget.example}`, wordId: contextTarget.word, targetText: blankSentence(contextTarget),
    },
    {
      id: `${lesson.id}-speaking`, skill: "speaking", prompt: "听一听，再跟兔兔读一读", helper: `${sceneLabel} · 跟读挑战`, options: [], answer: "完成跟读", explanation: `示范句：${speakingTarget.example}`, wordId: speakingTarget.word, targetText: speakingTarget.example,
    },
  ];
  const elementaryEnrichment: Question[] = lesson.levelId === "L7" ? [] : [
    {
      id: `${lesson.id}-word-complete`, skill: "word-complete", prompt: "字母气球飞走啦，帮兔兔补回来", helper: `${sceneLabel} · 字母气球`, options: makeSpellingOptions(reinforcementMeaningTarget.word, completionMissingLetters), answer: completionMissingLetters.map((index) => reinforcementMeaningTarget.word[index].toUpperCase()).join(""), explanation: `${reinforcementMeaningTarget.word} 的意思是“${reinforcementMeaningTarget.meaning}”。${reinforcementMeaningTarget.example}`, wordId: reinforcementMeaningTarget.word, targetText: reinforcementMeaningTarget.word, missingLetters: completionMissingLetters,
    },
    {
      id: `${lesson.id}-context-review`, skill: "context", prompt: "把合适的单词放进句子里", helper: `${lesson.scene} · 语境巩固`, options: choicesFor(reinforcementContextTarget, "word"), answer: reinforcementContextTarget.word, explanation: `完整句子：${reinforcementContextTarget.example}`, wordId: reinforcementContextTarget.word, targetText: blankSentence(reinforcementContextTarget),
    },
  ];
  return [...coreQuestions, ...elementaryEnrichment];
};

export const LESSONS: Lesson[] = COURSE_SEEDS.map((lesson) => ({
  ...lesson,
  targetWords: lesson.targets.map((target) => target.word),
  questions: makeQuestions(lesson),
}));

const LESSON_REVIEW_WORDS: ReviewWord[] = Array.from(
  new Map<string, ReviewWord>(
    LESSONS.flatMap((lesson) => lesson.targets.map((target) => [target.word, {
      id: target.word,
      word: target.word,
      phonetic: "",
      meaning: target.meaning,
      example: target.example,
      levelId: lesson.levelId,
    }] as const)),
  ).values(),
);

export const REVIEW_WORDS: ReviewWord[] = Array.from(new Map([...LESSON_REVIEW_WORDS, ...EXTENDED_REVIEW_WORDS, ...ALL_UPLOADED_MATERIAL_WORDS].map((word) => [word.id.toLowerCase(), word])).values());

export const getLessonById = (id: string) => LESSONS.find((lesson) => lesson.id === id);
export const getLessonsForLevel = (levelId: string) => LESSONS.filter((lesson) => lesson.levelId === levelId);
export const getTotalLessonsForLevel = (levelId: string) => getLessonsForLevel(levelId).length;
