import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { RabbitAvatar } from "@/components/rabbit-avatar";

export type RabbitFeedbackState = "idle" | "success" | "retry" | "complete";
const copy: Record<RabbitFeedbackState, string | null> = { idle: null, success: "太棒了！", retry: "没关系，再试试", complete: "兔兔为你喝彩！" };
export function FeedbackRabbit({ state, size = 64 }: { state: RabbitFeedbackState; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    scale.setValue(1); shift.setValue(0); sparkle.setValue(0);
    if (state === "success") Animated.parallel([Animated.sequence([Animated.timing(scale, { toValue: 1.13, duration: 150, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, friction: 4, tension: 190, useNativeDriver: true })]), Animated.sequence([Animated.timing(sparkle, { toValue: 1, duration: 120, useNativeDriver: true }), Animated.timing(sparkle, { toValue: 0, duration: 500, useNativeDriver: true })])]).start();
    if (state === "retry") Animated.sequence([Animated.timing(shift, { toValue: -5, duration: 65, useNativeDriver: true }), Animated.timing(shift, { toValue: 5, duration: 65, useNativeDriver: true }), Animated.timing(shift, { toValue: -3, duration: 55, useNativeDriver: true }), Animated.timing(shift, { toValue: 0, duration: 55, useNativeDriver: true })]).start();
    if (state === "complete") Animated.parallel([Animated.sequence([Animated.timing(scale, { toValue: 1.2, duration: 240, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, friction: 4, tension: 145, useNativeDriver: true })]), Animated.timing(sparkle, { toValue: 1, duration: 360, useNativeDriver: true })]).start();
  }, [scale, shift, sparkle, state]);
  const bubble = copy[state];
  const sparkStyle = useMemo(() => ({ opacity: sparkle, transform: [{ scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.25] }) }] }), [sparkle]);
  return <View style={styles.wrap} accessibilityLiveRegion="polite">{bubble ? <View style={[styles.bubble, state === "retry" && styles.bubbleRetry]}><Text style={[styles.bubbleText, state === "retry" && styles.bubbleTextRetry]}>{bubble}</Text></View> : null}<Animated.View style={{ transform: [{ translateX: shift }, { scale }] }}><RabbitAvatar size={size} accent={state === "success" || state === "complete" ? "#E4F7E9" : state === "retry" ? "#FFF0D7" : "#FDE5CE"} /></Animated.View>{state !== "idle" ? <Animated.Text style={[styles.sparkles, sparkStyle]}>✦ ★ ✦</Animated.Text> : null}</View>;
}
const styles = StyleSheet.create({ wrap: { alignItems: "center", justifyContent: "center", minWidth: 82 }, bubble: { backgroundColor: "#E4F7E9", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 4 }, bubbleRetry: { backgroundColor: "#FFF0D7" }, bubbleText: { color: "#2B7940", fontWeight: "900", fontSize: 11 }, bubbleTextRetry: { color: "#A5601F" }, sparkles: { position: "absolute", bottom: -13, color: "#E5A62F", fontWeight: "900", fontSize: 12, letterSpacing: -2 } });
