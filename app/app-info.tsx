import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import { getTrialStatus, type TrialStatus } from "@/lib/activation";
import { ActivationModal } from "@/components/activation-modal";

export default function AppInfoScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [showModal, setShowModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getTrialStatus().then(setStatus);
    }, []),
  );

  const appName = Constants.expoConfig?.name ?? "兔兔英语闯关";
  const appVersion = Constants.expoConfig?.version ?? "1.0.5";

  const activationLine = !status
    ? "加载中…"
    : status.activated
      ? "已永久激活 ✓"
      : status.expired
        ? "试用已结束，需激活"
        : `试用中 · 剩余 ${status.remainingDays} 天`;

  const activationColor = !status
    ? "#7D746B"
    : status.activated
      ? "#2D8441"
      : status.expired
        ? "#C0392B"
        : "#B65B18";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="返回" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>App 信息</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.appEmoji}>🐰</Text>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.appVersion}>版本 {appVersion}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>关于作者</Text>
          <View style={styles.row}>
            <Text style={styles.label}>作者</Text>
            <Text style={styles.value}>chary</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>联系方式</Text>
            <Text style={styles.value}>124724243@qq.com</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>激活状态</Text>
          <View style={styles.row}>
            <Text style={styles.label}>当前状态</Text>
            <Text style={[styles.value, { color: activationColor, fontWeight: "900" }]}>{activationLine}</Text>
          </View>
          <Text style={styles.tip}>免费试用为 3 天，试用结束后需输入激活码方可继续使用；激活后永久解锁全部功能。</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="输入激活码"
            onPress={() => setShowModal(true)}
            style={({ pressed }) => [styles.activateButton, pressed && styles.activatePressed]}
          >
            <Text style={styles.activateButtonText}>输入激活码</Text>
          </Pressable>
        </View>
      </ScrollView>

      {showModal ? (
        <ActivationModal
          onSuccess={() => {
            setShowModal(false);
            getTrialStatus().then(setStatus);
          }}
          onClose={() => setShowModal(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5E4" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  backButton: { paddingVertical: 6, paddingRight: 12 },
  backText: { fontSize: 16, fontWeight: "800", color: "#E96E2B" },
  headerTitle: { fontSize: 17, fontWeight: "900", color: "#2E2A25" },
  headerSpacer: { width: 56 },
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  hero: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#EEE8DE" },
  appEmoji: { fontSize: 52 },
  appName: { fontSize: 22, fontWeight: "900", color: "#2E2A25", marginTop: 8 },
  appVersion: { fontSize: 13, color: "#9A9289", marginTop: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#EEE8DE" },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#2E2A25", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F3EEE6" },
  label: { fontSize: 14, color: "#7D746B", fontWeight: "700" },
  value: { fontSize: 14, color: "#2E2A25", fontWeight: "800" },
  tip: { fontSize: 12, color: "#A89E92", lineHeight: 18, marginTop: 10 },
  activateButton: { marginTop: 14, backgroundColor: "#F5803E", borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  activatePressed: { opacity: 0.85 },
  activateButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
