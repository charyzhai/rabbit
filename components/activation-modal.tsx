import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { activate } from "@/lib/activation";

interface ActivationModalProps {
  onSuccess: () => void;
  // 提供 onClose 时显示右上角关闭按钮（非强制激活场景）；
  // 不提供则为「阻塞式」——必须输入正确激活码才能继续。
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export function ActivationModal({ onSuccess, onClose, title, subtitle }: ActivationModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleActivate = async () => {
    if (!code.trim() || verifying) return;
    setVerifying(true);
    setError("");
    try {
      const ok = await activate(code);
      if (ok) {
        onSuccess();
      } else {
        setError("激活码不正确，请重试。");
      }
    } catch {
      setError("校验失败，请稍后重试。");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {onClose ? (
          <Pressable accessibilityRole="button" accessibilityLabel="关闭" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        ) : null}

        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>{title ?? "免费试用已结束"}</Text>
        <Text style={styles.subtitle}>{subtitle ?? "请输入激活码以永久解锁全部学习内容。"}</Text>

        <TextInput
          style={styles.input}
          placeholder="请输入激活码"
          placeholderTextColor="#B7AEA4"
          value={code}
          onChangeText={(text) => {
            setCode(text);
            if (error) setError("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          editable={!verifying}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="激活"
          onPress={handleActivate}
          disabled={!code.trim() || verifying}
          style={({ pressed }) => [styles.button, (!code.trim() || verifying) && styles.buttonDisabled, pressed && styles.buttonPressed]}
        >
          {verifying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>激活</Text>}
        </Pressable>

        <Text style={styles.hint}>需要激活码？请在「App 信息」中查看联系方式联系作者。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFF5E4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 999,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: "#FFE5B6",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: "#9A9289",
    fontWeight: "900",
  },
  emoji: { fontSize: 46, marginTop: 6 },
  title: { fontSize: 21, fontWeight: "900", color: "#2E2A25", marginTop: 12, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#7D746B", marginTop: 8, textAlign: "center", lineHeight: 20 },
  input: {
    width: "100%",
    marginTop: 20,
    backgroundColor: "#FBF6EE",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EADFCD",
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: "#2E2A25",
    textAlign: "center",
    letterSpacing: 1,
  },
  error: { color: "#C0392B", fontSize: 13, marginTop: 10, fontWeight: "700" },
  button: {
    width: "100%",
    marginTop: 16,
    backgroundColor: "#F5803E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#F2C7A8" },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  hint: { fontSize: 12, color: "#A89E92", marginTop: 16, textAlign: "center", lineHeight: 17 },
});
