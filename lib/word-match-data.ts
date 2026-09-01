export type WordPicture = { id: string; word: string; meaning: string; imageUri?: string; emoji?: string };

const asset = (name: string) => `https://rabbitenq-bfg2mdyh.manus.space/manus-storage/${name}`;

export const WORD_MATCH_ROUNDS: Array<{ id: string; title: string; subtitle: string; items: WordPicture[] }> = [
  { id: "home", title: "生活词图连线", subtitle: "把英文图片拖到正确的中文词义上", items: [
    { id: "rabbit", word: "rabbit", meaning: "兔子", imageUri: asset("word-rabbit_03ef041f.png") },
    { id: "apple", word: "apple", meaning: "苹果", imageUri: asset("word-apple_ac13c9a5.png") },
    { id: "book", word: "book", meaning: "书", imageUri: asset("word-book_8862c158.png") },
    { id: "dog", word: "dog", meaning: "小狗", imageUri: asset("word-dog_5356daac.png") },
  ] },
  { id: "outside", title: "校园词图连线", subtitle: "试试第二组常见生活词", items: [
    { id: "ball", word: "ball", meaning: "球", imageUri: asset("word-ball_a1c75945.png") },
    { id: "school", word: "school", meaning: "学校", imageUri: asset("word-school_730c1e33.png") },
    { id: "flower", word: "flower", meaning: "花", imageUri: asset("word-flower_dbde76ce.png") },
    { id: "bus", word: "bus", meaning: "公交车", imageUri: asset("word-bus_7c7702ba.png") },
  ] },
  { id: "new-materials", title: "新词图连线", subtitle: "把新增材料词和图片一一配对", items: [
    { id: "kite", word: "kite", meaning: "风筝", imageUri: asset("word-kite_f5542b18.png") },
    { id: "peach", word: "peach", meaning: "桃", imageUri: asset("word-peach_9e621c71.png") },
    { id: "lamp", word: "lamp", meaning: "台灯", imageUri: asset("word-lamp_2f8eeb27.png") },
    { id: "planet", word: "planet", meaning: "行星", imageUri: asset("word-planet_793517bb.png") },
  ] },
  { id: "helpers", title: "职业与节日词图", subtitle: "认识帮助大家的人和特别的日子", items: [
    { id: "policeman", word: "policeman", meaning: "警察", imageUri: asset("word-policeman_df028c7b.png") },
    { id: "kite-2", word: "kite", meaning: "风筝", imageUri: asset("word-kite_f5542b18.png") },
    { id: "peach-2", word: "peach", meaning: "桃", imageUri: asset("word-peach_9e621c71.png") },
    { id: "lamp-2", word: "lamp", meaning: "台灯", imageUri: asset("word-lamp_2f8eeb27.png") },
  ] },
  { id: "fruit", title: "水果主题包", subtitle: "认一认甜甜的水果", items: [
    { id: "fruit-apple", word: "apple", meaning: "苹果", imageUri: asset("word-apple_ac13c9a5.png") },
    { id: "fruit-banana", word: "banana", meaning: "香蕉", emoji: "🍌" },
    { id: "fruit-orange", word: "orange", meaning: "橙子", emoji: "🍊" },
    { id: "fruit-watermelon", word: "watermelon", meaning: "西瓜", emoji: "🍉" },
  ] },
  { id: "animals", title: "动物主题包", subtitle: "和动物朋友打个招呼", items: [
    { id: "animal-rabbit", word: "rabbit", meaning: "兔子", imageUri: asset("word-rabbit_03ef041f.png") },
    { id: "animal-dog", word: "dog", meaning: "小狗", imageUri: asset("word-dog_5356daac.png") },
    { id: "animal-cat", word: "cat", meaning: "小猫", emoji: "🐱" },
    { id: "animal-bird", word: "bird", meaning: "小鸟", emoji: "🐦" },
  ] },
  { id: "traffic", title: "交通主题包", subtitle: "看看城市里的交通工具", items: [
    { id: "traffic-bus", word: "bus", meaning: "公交车", imageUri: asset("word-bus_7c7702ba.png") },
    { id: "traffic-car", word: "car", meaning: "汽车", emoji: "🚗" },
    { id: "traffic-bike", word: "bike", meaning: "自行车", emoji: "🚲" },
    { id: "traffic-train", word: "train", meaning: "火车", emoji: "🚆" },
  ] },
  { id: "weather", title: "天气主题包", subtitle: "观察每天不一样的天空", items: [
    { id: "weather-sun", word: "sun", meaning: "太阳", emoji: "☀️" },
    { id: "weather-cloud", word: "cloud", meaning: "云", emoji: "☁️" },
    { id: "weather-rain", word: "rain", meaning: "雨", emoji: "🌧️" },
    { id: "weather-snow", word: "snow", meaning: "雪", emoji: "❄️" },
  ] },
];
