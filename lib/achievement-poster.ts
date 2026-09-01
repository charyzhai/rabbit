export type AchievementPosterData = { studentName: string; badgeName: string; badgeIcon: string; acquiredAt: string };
const xml = (value: string) => value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));

export const createAchievementPosterSvg = ({ studentName, badgeName, badgeIcon, acquiredAt }: AchievementPosterData) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFF3D8"/><stop offset="1" stop-color="#EDE8FF"/></linearGradient></defs>
  <rect width="1080" height="1440" fill="url(#bg)"/><circle cx="920" cy="150" r="150" fill="#F7C55C" opacity=".35"/><circle cx="135" cy="1260" r="190" fill="#7B6FEA" opacity=".16"/>
  <text x="540" y="190" text-anchor="middle" font-family="sans-serif" font-size="45" font-weight="700" fill="#6E5BA9">兔兔英语闯关</text>
  <text x="540" y="280" text-anchor="middle" font-family="sans-serif" font-size="62" font-weight="800" fill="#413766">成就纪念卡</text>
  <rect x="120" y="360" width="840" height="780" rx="58" fill="#FFFFFF" opacity=".92"/>
  <text x="540" y="560" text-anchor="middle" font-family="sans-serif" font-size="190">${xml(badgeIcon)}</text>
  <text x="540" y="680" text-anchor="middle" font-family="sans-serif" font-size="50" font-weight="700" fill="#9A7B3B">恭喜 ${xml(studentName)}</text>
  <text x="540" y="790" text-anchor="middle" font-family="sans-serif" font-size="76" font-weight="800" fill="#3C315F">${xml(badgeName)}</text>
  <text x="540" y="880" text-anchor="middle" font-family="sans-serif" font-size="38" fill="#756A86">已成功解锁稀有隐藏徽章</text>
  <line x1="270" y1="945" x2="810" y2="945" stroke="#E7DDBD" stroke-width="3"/>
  <text x="540" y="1025" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#7C7066">获得日期：${xml(acquiredAt)}</text>
  <text x="540" y="1245" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="700" fill="#6B5DA5">一步一星，勇敢成长</text>
</svg>`;
