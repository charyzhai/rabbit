import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";

import { isParentSessionUnlocked } from "@/lib/parent-security";
import { ScreenContainer } from "@/components/screen-container";

const SYNC_CODE = /^[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}$/;

export default function ScanSyncScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  useFocusEffect(useCallback(() => { isParentSessionUnlocked().then((unlocked) => { if (!unlocked) router.replace({ pathname: "/parent-gate", params: { target: "parent-settings" } } as never); }); }, [router]));
  const onScan = ({ data }: { data: string }) => { if (scanned) return; const code = data.trim().toUpperCase(); if (!SYNC_CODE.test(code)) return; setScanned(true); router.replace({ pathname: "/cloud-sync", params: { syncCode: code } } as never); };
  if (!permission) return <ScreenContainer className="items-center justify-center"><Text>正在准备相机…</Text></ScreenContainer>;
  if (!permission.granted) return <ScreenContainer className="items-center justify-center p-6"><Text style={styles.permissionTitle}>需要相机权限</Text><Text style={styles.permissionText}>仅用于扫描家长手动传递的加密同步码，不会拍照或上传相机画面。</Text><Pressable accessibilityRole="button" accessibilityLabel="允许使用相机扫码" onPress={requestPermission} style={styles.permissionButton}><Text style={styles.permissionButtonText}>允许相机权限</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="返回同步码页面" onPress={() => router.back()} style={styles.cancel}><Text style={styles.cancelText}>返回</Text></Pressable></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.page}><View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="返回同步码页面" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.nav}>扫码填入同步码</Text><View style={styles.space} /></View><Text style={styles.tip}>将相机对准另一台设备展示的同步码二维码。</Text><View style={styles.cameraWrap}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : onScan} /><View pointerEvents="none" style={styles.frame} /></View><Text style={styles.hint}>只识别格式正确的15位同步码。若无法扫描，可返回后手动输入。</Text></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, padding: 20, backgroundColor: "#FFF9F0" }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, nav: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, space: { width: 38 }, tip: { color: "#776E65", fontSize: 14, lineHeight: 21, marginTop: 25 }, cameraWrap: { height: 350, borderRadius: 25, overflow: "hidden", marginTop: 20, backgroundColor: "#25211D" }, camera: { flex: 1 }, frame: { position: "absolute", width: 205, height: 205, borderWidth: 3, borderColor: "#FFFFFF", borderRadius: 20, top: 72, alignSelf: "center" }, hint: { color: "#837970", fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 16, paddingHorizontal: 18 }, permissionTitle: { color: "#2E2A25", fontSize: 22, fontWeight: "900" }, permissionText: { color: "#746B63", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10, maxWidth: 285 }, permissionButton: { backgroundColor: "#5D58B5", borderRadius: 15, paddingVertical: 14, paddingHorizontal: 20, marginTop: 23 }, permissionButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, cancel: { paddingVertical: 15, marginTop: 6 }, cancelText: { color: "#5D58B5", fontSize: 14, fontWeight: "900" } });
