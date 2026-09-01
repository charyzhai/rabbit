import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

export type TrendPoint = { label: string; value: number | null };

export function LineChart({ points, color = "#5C58B5", suffix = "%" }: { points: TrendPoint[]; color?: string; suffix?: string }) {
  const valid = points.filter((item): item is { label: string; value: number } => item.value !== null);
  if (!valid.length) return <View style={styles.empty}><Text style={styles.emptyText}>完成一次词汇练习后，这里会出现你的趋势。</Text></View>;
  const width = 300; const height = 118; const padding = 14;
  const max = Math.max(...valid.map((item) => item.value), 100);
  const min = Math.min(...valid.map((item) => item.value), 0);
  const span = Math.max(1, max - min);
  const at = (index: number, value: number) => ({ x: padding + (index * (width - padding * 2)) / Math.max(1, points.length - 1), y: height - padding - ((value - min) / span) * (height - padding * 2) });
  const polyline = points.map((item, index) => at(index, item.value ?? min).x + "," + at(index, item.value ?? min).y).join(" ");
  const latest = valid[valid.length - 1].value;
  return <View><View style={styles.chartHeader}><Text style={styles.latest}>{latest}{suffix}</Text><Text style={styles.latestLabel}>最近一次掌握度</Text></View><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E9E2D9" strokeWidth="1" /><Line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#F1ECE5" strokeWidth="1" strokeDasharray="4 4" /><Polyline points={polyline} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{points.map((item, index) => item.value === null ? null : <Circle key={`${item.label}-${index}`} cx={at(index, item.value).x} cy={at(index, item.value).y} r="4" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />)}</Svg><View style={styles.labels}>{points.map((item) => <Text key={item.label} style={styles.label}>{item.label}</Text>)}</View></View>;
}

const styles = StyleSheet.create({ chartHeader: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 3 }, latest: { color: "#5C58B5", fontSize: 24, fontWeight: "900" }, latestLabel: { color: "#837B74", fontSize: 12, fontWeight: "700" }, labels: { flexDirection: "row", justifyContent: "space-between", marginTop: -1 }, label: { color: "#9A9289", fontSize: 9, fontWeight: "700" }, empty: { height: 120, borderRadius: 15, backgroundColor: "#FAF7F2", alignItems: "center", justifyContent: "center", padding: 16 }, emptyText: { color: "#8C837A", fontSize: 12, lineHeight: 18, textAlign: "center" } });
