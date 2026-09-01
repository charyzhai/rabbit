import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const DOTS = [
  { x: -92, y: -72, color: "#F6C84E", glyph: "★" }, { x: -55, y: -112, color: "#F5803E", glyph: "✦" }, { x: -7, y: -90, color: "#7B6FEA", glyph: "●" }, { x: 45, y: -116, color: "#46A758", glyph: "✦" }, { x: 92, y: -72, color: "#4A9FE8", glyph: "★" }, { x: -105, y: -18, color: "#D85C87", glyph: "●" }, { x: 108, y: -18, color: "#F2B84B", glyph: "●" },
];

export function ParticleCelebration({ visible, onFinished }: { visible: boolean; onFinished?: () => void }) {
  const values = useMemo(() => DOTS.map(() => new Animated.Value(0)), []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!visible) return;
    values.forEach((value) => value.setValue(0));
    Animated.stagger(35, values.map((value) => Animated.sequence([Animated.timing(value, { toValue: 1, duration: 420, useNativeDriver: true }), Animated.timing(value, { toValue: 0, duration: 330, useNativeDriver: true })]))).start();
    timer.current = setTimeout(() => onFinished?.(), 980);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [onFinished, values, visible]);
  if (!visible) return null;
  return <View pointerEvents="none" style={styles.overlay}>{DOTS.map((item, index) => <Animated.Text key={`${item.x}-${item.y}`} style={[styles.particle, { color: item.color, opacity: values[index], transform: [{ translateX: values[index].interpolate({ inputRange: [0, 1], outputRange: [0, item.x] }) }, { translateY: values[index].interpolate({ inputRange: [0, 1], outputRange: [10, item.y] }) }, { scale: values[index].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }] }]}>{item.glyph}</Animated.Text>)}</View>;
}

const styles = StyleSheet.create({ overlay: { position: "absolute", left: "50%", top: "42%", width: 1, height: 1, alignItems: "center", justifyContent: "center", zIndex: 20 }, particle: { position: "absolute", fontSize: 23, fontWeight: "900" } });
