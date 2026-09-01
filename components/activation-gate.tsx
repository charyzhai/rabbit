import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { activate, getTrialStatus } from "@/lib/activation";
import { ActivationModal } from "@/components/activation-modal";

interface ActivationGateProps {
  children: ReactNode;
}

// 应用级激活闸门：
// - 首次启动记录试用起点；
// - 试用 3 天内正常进入；
// - 超过 3 天且未激活时，强制弹出激活框，不输入正确激活码无法使用 App。
export function ActivationGate({ children }: ActivationGateProps) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const status = await getTrialStatus();
      if (!active) return;
      setBlocked(status.expired && !status.activated);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#F5803E" />
        <Text style={styles.splashText}>正在初始化…</Text>
      </View>
    );
  }

  if (blocked) {
    return <ActivationModal onSuccess={() => setBlocked(false)} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#FFF5E4",
    alignItems: "center",
    justifyContent: "center",
  },
  splashText: {
    marginTop: 14,
    fontSize: 14,
    color: "#A89E92",
    fontWeight: "700",
  },
});
