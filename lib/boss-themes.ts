export type BossTheme = { levelId: string; scene: string; badgeName: string; badgeIcon: string; accent: string; imageUri?: string };

const host = "https://rabbitenq-bfg2mdyh.manus.space/manus-storage";

export const BOSS_THEMES: BossTheme[] = [
  { levelId: "l1", scene: "晨光校园", badgeName: "启蒙小萌芽", badgeIcon: "🌱", accent: "#F5803E", imageUri: `${host}/boss-g1-school_3aeca5b7.png` },
  { levelId: "l2", scene: "玩具游乐园", badgeName: "玩具探索家", badgeIcon: "🧸", accent: "#D16EC5", imageUri: `${host}/boss-g2-playground_053cd2aa.png` },
  { levelId: "l3", scene: "家庭花园", badgeName: "花园小伙伴", badgeIcon: "🌼", accent: "#49A567", imageUri: `${host}/boss-g3-garden_2a0f6ed8.png` },
  { levelId: "l4", scene: "水果市集", badgeName: "市集小达人", badgeIcon: "🍎", accent: "#DF7751", imageUri: `${host}/boss-g4-market_b96b62c5.png` },
  { levelId: "l5", scene: "节日广场", badgeName: "节日小使者", badgeIcon: "🎈", accent: "#7B6FEA", imageUri: `${host}/boss-g5-festival_fedf1c33.png` },
  { levelId: "l6", scene: "故事城堡", badgeName: "故事守护者", badgeIcon: "🏰", accent: "#4C98D9", imageUri: `${host}/boss-g6-castle_0f1b3136.png` },
  { levelId: "l7", scene: "星空探索站", badgeName: "星空探险家", badgeIcon: "🔭", accent: "#5D58B5" },
];

export const getBossTheme = (levelId: string) => BOSS_THEMES.find((item) => item.levelId === levelId) ?? BOSS_THEMES[0];
