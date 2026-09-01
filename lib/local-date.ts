/** 以设备本地日历生成稳定的 YYYY-MM-DD 键，避免 UTC 跨日影响连续学习和周报。 */
export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** 按本地日历偏移日期；以正午作为解析点，避免夏令时切换造成日期回退。 */
export const shiftLocalDateKey = (key: string, offsetDays: number) => {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, 12);
  date.setDate(date.getDate() + offsetDays);
  return localDateKey(date);
};
