import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingState({ title = "兔兔正在准备…", description, compact = false }: { title?: string; description?: string; compact?: boolean }) {
  return <View style={[styles.box, compact && styles.compact]} accessibilityRole="progressbar" accessibilityLabel={title}>
    <ActivityIndicator size={compact ? "small" : "large"} color="#F5803E" />
    <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center", minHeight: 170, paddingHorizontal: 28, backgroundColor: "#FFF9F0" },
  compact: { minHeight: 86, paddingVertical: 14, backgroundColor: "transparent" },
  title: { color: "#6B5140", fontSize: 15, fontWeight: "900", marginTop: 13, textAlign: "center" },
  compactTitle: { fontSize: 13, marginTop: 9 },
  description: { color: "#8B7A6D", fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" },
});
