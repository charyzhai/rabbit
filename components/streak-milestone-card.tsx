import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export function StreakMilestoneCard({ days, onClaim }: { days: number; onClaim: () => void }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const starLift = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.parallel([Animated.spring(scale, { toValue: 1, friction: 6, tension: 125, useNativeDriver: true }), Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }), Animated.loop(Animated.sequence([Animated.timing(starLift, { toValue: -5, duration: 620, useNativeDriver: true }), Animated.timing(starLift, { toValue: 0, duration: 620, useNativeDriver: true })]))]).start(); }, [opacity, scale, starLift]);
  return <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}><Animated.Text style={[styles.emoji, { transform: [{ translateY: starLift }] }]}>{days >= 30 ? "🏆" : "🎉"}</Animated.Text><View style={styles.copy}><Text style={styles.title}>连续学习 {days} 天！</Text><Text style={styles.body}>兔兔送你里程碑徽章和 {Math.max(1, Math.round(days / 3))} 颗奖励星星。</Text></View><Pressable accessibilityRole="button" accessibilityLabel="领取连续学习里程碑奖励" onPress={onClaim} style={({ pressed }) => [styles.claim, pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }]}><Text style={styles.claimText}>领取</Text></Pressable></Animated.View>;
}

const styles = StyleSheet.create({ card: { backgroundColor: "#FFF0D7", borderRadius: 20, padding: 14, marginTop: 12, flexDirection: "row", alignItems: "center" }, emoji: { fontSize: 28, marginRight: 9 }, copy: { flex: 1 }, title: { color: "#8C521B", fontSize: 14, fontWeight: "900" }, body: { color: "#946A41", fontSize: 11, lineHeight: 16, marginTop: 3 }, claim: { backgroundColor: "#F5803E", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 8 }, claimText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" } });
