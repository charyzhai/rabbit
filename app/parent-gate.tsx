import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { authenticateParentBiometric, getParentPinAccessState, hasParentPin, isBiometricUnlockAvailable, setParentPin, verifyParentPin } from "@/lib/parent-security";
import { ScreenContainer } from "@/components/screen-container";
import { LoadingState } from "@/components/loading-state";
import { TransitionIn } from "@/components/transition-in";

type ParentTarget = "report" | "children" | "parent-settings";
const toPath = (target: ParentTarget) => target === "report" ? "/report" : target === "children" ? "/children" : "/parent-settings";

export default function ParentGateScreen() {
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: ParentTarget }>();
  const destination = (target === "children" || target === "parent-settings" || target === "report") ? target : "report";
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [now, setNow] = useState(Date.now());
  const refreshAccess = async () => { const [pinConfigured, accessState, biometricReady] = await Promise.all([hasParentPin(), getParentPinAccessState(), isBiometricUnlockAvailable()]); setConfigured(pinConfigured); setLockedUntil(accessState.lockedUntil); setBiometricAvailable(biometricReady); };
  useEffect(() => { void refreshAccess(); }, []);
  useEffect(() => { if (lockedUntil <= Date.now()) return; const timer = setInterval(() => setNow(Date.now()), 1_000); return () => clearInterval(timer); }, [lockedUntil]);
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!configured) {
        if (pin !== confirmPin) throw new Error("两次输入的PIN不一致。");
        await setParentPin(pin);
      } else { const result = await verifyParentPin(pin); if (!result.success) { if (result.reason === "locked") { setLockedUntil(result.lockedUntil ?? Date.now()); throw new Error("PIN连续输入错误，已暂时锁定。请稍后再试或使用生物识别。" ); } throw new Error(result.reason === "incorrect" ? `PIN码不正确，还可尝试 ${result.remainingAttempts ?? 0} 次。` : "未设置家长PIN码。"); } }
      router.replace(toPath(destination) as never);
    } catch (error) { Alert.alert("未能进入家长模式", error instanceof Error ? error.message : "请稍后重试。"); } finally { setBusy(false); }
  };
  const isLocked = lockedUntil > now;
  const lockMessage = useMemo(() => { const seconds = Math.max(0, Math.ceil((lockedUntil - now) / 1_000)); return `${Math.floor(seconds / 60)} 分 ${String(seconds % 60).padStart(2, "0")} 秒`; }, [lockedUntil, now]);
  const biometric = async () => { if (busy || !biometricAvailable) return; setBusy(true); try { const success = await authenticateParentBiometric(); if (success) router.replace(toPath(destination) as never); else Alert.alert("未能解锁", "请使用PIN码继续，或在家长设置和设备中完成生物识别配置。"); } finally { setBusy(false); } };
  if (configured === null) return <ScreenContainer><LoadingState title="正在检查家长保护…" description="兔兔正在确认本机的安全设置" /></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.page}><Pressable accessibilityRole="button" accessibilityLabel="返回我的学习" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><TransitionIn trigger={configured ? "configured" : "setup"}><View style={styles.lock}><Text style={styles.lockIcon}>🔐</Text><Text style={styles.title}>{configured ? "家长模式" : "设置家长PIN"}</Text><Text style={styles.subtitle}>{configured ? "请输入4位PIN码，查看儿童档案、报告与备份。" : "首次设置4位PIN码，用于保护家长侧的学习数据和档案管理。"}</Text></View><View style={styles.form}>{isLocked ? <><Text style={styles.lockedText}>PIN暂时锁定，还需 {lockMessage}。</Text><Text style={styles.lockedHint}>{biometricAvailable ? "可使用已开启的生物识别解锁；PIN到期后会自动恢复。" : "PIN到期后会自动恢复。"}</Text></> : <><Text style={styles.label}>{configured ? "输入PIN码" : "设置4位PIN码"}</Text><TextInput value={pin} onChangeText={(text) => setPin(text.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} style={styles.input} placeholder="••••" placeholderTextColor="#B5ADA4" returnKeyType="done" onSubmitEditing={submit} editable={!busy} />{!configured ? <><Text style={styles.label}>再次确认PIN码</Text><TextInput value={confirmPin} onChangeText={(text) => setConfirmPin(text.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} style={styles.input} placeholder="••••" placeholderTextColor="#B5ADA4" returnKeyType="done" onSubmitEditing={submit} editable={!busy} /></> : null}</>}<Pressable accessibilityRole="button" accessibilityLabel={configured ? "验证PIN并进入家长模式" : "保存家长PIN"} onPress={submit} disabled={busy || isLocked} style={({ pressed }) => [styles.submit, pressed && { transform: [{ scale: 0.98 }] }, (busy || isLocked) && { opacity: 0.6 }]}><Text style={styles.submitText}>{busy ? "正在验证…" : configured ? "进入家长模式" : "保存并进入"}</Text></Pressable>{configured && biometricAvailable ? <Pressable accessibilityRole="button" accessibilityLabel="用生物识别解锁家长模式" onPress={biometric} disabled={busy} style={[styles.biometric, busy && styles.biometricDisabled]}><Text style={styles.biometricText}>指纹或面容解锁</Text></Pressable> : null}</View></TransitionIn><Text style={styles.note}>连续5次输入错误会冷却5分钟。PIN采用带盐哈希并保存到设备安全存储。</Text></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, padding: 20, backgroundColor: "#FFF9F0" }, back: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, lock: { alignItems: "center", marginTop: 52 }, lockIcon: { fontSize: 46 }, title: { color: "#2E2A25", fontSize: 26, fontWeight: "900", marginTop: 15 }, subtitle: { color: "#766E68", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9, maxWidth: 300 }, form: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginTop: 31, borderWidth: 1, borderColor: "#EEE7DE" }, label: { color: "#4B433C", fontSize: 13, fontWeight: "900", marginTop: 4 }, input: { height: 51, borderRadius: 14, borderWidth: 1, borderColor: "#E7DED4", marginTop: 8, marginBottom: 16, paddingHorizontal: 16, color: "#2E2A25", fontSize: 22, letterSpacing: 9, textAlign: "center" }, submit: { backgroundColor: "#5D58B5", borderRadius: 15, paddingVertical: 14, alignItems: "center", marginTop: 4 }, submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, biometric: { alignItems: "center", paddingVertical: 13, marginTop: 5 }, biometricDisabled: { opacity: 0.55 }, biometricText: { color: "#5D58B5", fontSize: 13, fontWeight: "900" }, lockedText: { color: "#B1464E", lineHeight: 20, fontSize: 14, fontWeight: "900" }, lockedHint: { color: "#82675E", lineHeight: 18, fontSize: 12, marginTop: 4, marginBottom: 10 }, note: { color: "#8B8177", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 18, paddingHorizontal: 12 } });
