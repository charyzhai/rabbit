import { shuffle } from "./learning-data";

export type RoleDialogue = { id: string; grade: string; title: string; scene: string; rabbitLine: string; prompt: string; options: string[]; answer: string; helper: string; reviewWordId: string };

const RAW_ROLE_DIALOGUES: RoleDialogue[] = [
  { id: "g1-hello", grade: "G1", title: "问候新同学", scene: "早晨的教室", rabbitLine: "Hello! I’m TuTu.", prompt: "你来扮演新同学，应该怎么说？", options: ["Hi, I’m Amy.", "I am a kite.", "It is blue."], answer: "Hi, I’m Amy.", helper: "Hello / Hi + I’m…", reviewWordId: "hello" },
  { id: "g2-toy", grade: "G2", title: "玩具乐园", scene: "课间游戏", rabbitLine: "I have a kite.", prompt: "你想邀请兔兔一起玩，选哪句？", options: ["Let’s play a game.", "I am a desk.", "It is rainy."], answer: "Let’s play a game.", helper: "Let’s + 动词…", reviewWordId: "game" },
  { id: "g3-room", grade: "G3", title: "寻找台灯", scene: "我的房间", rabbitLine: "Where is the lamp?", prompt: "台灯在书桌上，你该怎么回答？", options: ["It’s on the desk.", "I like noodles.", "She is a nurse."], answer: "It’s on the desk.", helper: "It’s on / in…", reviewWordId: "lamp" },
  { id: "g4-transport", grade: "G4", title: "上学路上", scene: "公交站", rabbitLine: "How do you go to school?", prompt: "你坐公交车上学，选哪句？", options: ["I go by bus.", "I went yesterday.", "I have a peach."], answer: "I go by bus.", helper: "I go by + 交通工具。", reviewWordId: "bus" },
  { id: "g5-shop", grade: "G5", title: "购物小帮手", scene: "水果商店", rabbitLine: "How much is the peach?", prompt: "它十元钱，选哪句？", options: ["It’s ten yuan.", "It is a vowel.", "I can a bus."], answer: "It’s ten yuan.", helper: "It’s + 价格。", reviewWordId: "peach" },
  { id: "g6-past", grade: "G6", title: "昨天的发现", scene: "公园散步", rabbitLine: "What did you do yesterday?", prompt: "你去了公园，选哪句？", options: ["I went to the park.", "I go to the park.", "I am a planet."], answer: "I went to the park.", helper: "did 问过去，用 went 等过去式回答。", reviewWordId: "park" },
  { id: "g7-club", grade: "G7", title: "加入英语社团", scene: "校园走廊", rabbitLine: "Would you like to join our club?", prompt: "你愿意加入，选哪句？", options: ["Yes, I’d love to.", "I am stress.", "It were sunny."], answer: "Yes, I’d love to.", helper: "Would you like…? 可以回答 Yes, I’d love to. ", reviewWordId: "club" },
];

/** 打乱选项顺序，正确答案不再固定出现在第一个。 */
export const ROLE_DIALOGUES: RoleDialogue[] = RAW_ROLE_DIALOGUES.map((d) => ({ ...d, options: shuffle(d.options) }));
