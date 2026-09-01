import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { LEVELS, REVIEW_WORDS } from "@/lib/learning-data";
import { trpc } from "@/lib/trpc";
import { cacheWordAudio, downloadOfflineAudio, getCachedWordAudio, getOfflineAudioStats, removeOfflineAudioForWords } from "@/lib/word-audio";
import { canStartAudioDownload, loadDownloadSettings, saveDownloadSettings, type DownloadSettings } from "@/lib/download-settings";
import { ScreenContainer } from "@/components/screen-container";

const PACK_SIZE = 40;

export default function AudioPackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("选择一个等级，下载该等级的核心单词示范音频。");
  const [busyLevel, setBusyLevel] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ levelId: string; complete: number; total: number } | null>(null);
  const [stats, setStats] = useState({ count: 0, bytes: 0 });
  const [settings, setSettings] = useState<DownloadSettings>({ wifiOnly: true });
  const utils = trpc.useUtils();
  const packCounts = useMemo(() => LEVELS.map((level) => ({ ...level, count: REVIEW_WORDS.filter((word) => word.levelId === level.id && /^[a-zA-Z-]+$/.test(word.word)).slice(0, PACK_SIZE).length })), []);
  const refreshStats = useCallback(() => { getOfflineAudioStats().then(setStats); }, []);
  useFocusEffect(useCallback(() => { refreshStats(); loadDownloadSettings().then(setSettings); }, [refreshStats]));
  const downloadPack = async (levelId: string, title: string) => {
    if (busyLevel) return;
    const permission = await canStartAudioDownload(settings); if (!permission.allowed) { Alert.alert("暂不开始下载", permission.reason); return; }
    setBusyLevel(levelId);
    const words = REVIEW_WORDS.filter((word) => word.levelId === levelId && /^[a-zA-Z-]+$/.test(word.word)).slice(0, PACK_SIZE);
    let complete = 0; let skipped = 0;
    try {
      for (const [index, word] of words.entries()) {
        setProgress({ levelId, complete: index, total: words.length });
        setStatus(`${title}：正在准备 ${index + 1}/${words.length} 个核心词…`);
        let meta = await getCachedWordAudio(word.word);
        if (!meta) {
          const data = await utils.dictionary.lookup.fetch({ word: word.word });
          meta = await cacheWordAudio({ ...data, cachedAt: new Date().toISOString() });
        }
        if (meta.audioUrl && !meta.offlineUri) { await downloadOfflineAudio(meta); complete += 1; } else if (meta.offlineUri) complete += 1; else skipped += 1;
        setProgress({ levelId, complete: index + 1, total: words.length });
      }
      setStatus(`${title} 已完成：${complete} 个离线音频${skipped ? `，${skipped} 个词暂使用设备发音` : ""}。`);
    } catch (error) { setStatus("下载中断。已完成的音频已保留，可在网络恢复后继续下载。"); Alert.alert("音频包未全部完成", error instanceof Error ? error.message : "请检查网络后重试。"); } finally { setBusyLevel(null); setProgress(null); refreshStats(); }
  };
  const deletePack = (levelId: string, title: string) => { const words = REVIEW_WORDS.filter((word) => word.levelId === levelId).map((word) => word.word); Alert.alert(`删除${title}音频包`, "删除后词汇仍可在线获取发音。", [{ text: "取消", style: "cancel" }, { text: "删除", style: "destructive", onPress: async () => { const removed = await removeOfflineAudioForWords(words); setStatus(`已删除 ${removed} 个${title}离线音频。`); refreshStats(); } }]); };
  const toggleWifiOnly = async () => { const next = { wifiOnly: !settings.wifiOnly }; await saveDownloadSettings(next); setSettings(next); };
  const formatBytes = (bytes: number) => bytes < 1_048_576 ? `${Math.max(0.1, bytes / 1024).toFixed(1)} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><FlatList data={packCounts} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<><View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="返回复习页" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.nav}>离线音频包</Text><View style={styles.space} /></View><Text style={styles.title}>把示范发音带在身边</Text><Text style={styles.subtitle}>每个等级下载最多 {PACK_SIZE} 个核心单词的在线示范音频。下载后在无网络环境中也可播放；未提供示范音频的词会保留设备发音回退。</Text><Pressable accessibilityRole="switch" accessibilityState={{ checked: settings.wifiOnly }} onPress={toggleWifiOnly} style={[styles.wifiSetting, settings.wifiOnly && styles.wifiOn]}><View><Text style={[styles.wifiTitle, settings.wifiOnly && styles.wifiTitleOn]}>仅Wi‑Fi下载</Text><Text style={[styles.wifiBody, settings.wifiOnly && styles.wifiBodyOn]}>开启后将阻止使用移动数据下载音频包。</Text></View><Text style={[styles.wifiState, settings.wifiOnly && styles.wifiStateOn]}>{settings.wifiOnly ? "已开启" : "已关闭"}</Text></Pressable><View style={styles.storage}><Text style={styles.storageValue}>{stats.count} 个 · {formatBytes(stats.bytes)}</Text><Text style={styles.storageLabel}>当前离线音频占用</Text></View><View style={styles.status}><Text style={styles.statusText}>{status}</Text></View></>} renderItem={({ item }) => { const itemProgress = progress?.levelId === item.id ? progress : null; return <View style={styles.card}><View style={styles.cardText}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardMeta}>{item.subtitle} · {item.count} 个核心词</Text>{itemProgress ? <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${itemProgress.total ? (itemProgress.complete / itemProgress.total) * 100 : 0}%` }]} /></View> : null}</View><View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`下载${item.title}离线音频包`} onPress={() => downloadPack(item.id, item.title)} style={[styles.download, busyLevel && busyLevel !== item.id && { opacity: 0.45 }]}><Text style={styles.downloadText}>{busyLevel === item.id ? `${itemProgress?.complete ?? 0}/${itemProgress?.total ?? item.count}` : "下载"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`删除${item.title}离线音频包`} onPress={() => deletePack(item.id, item.title)} disabled={Boolean(busyLevel)} style={[styles.delete, busyLevel && { opacity: 0.4 }]}><Text style={styles.deleteText}>删除</Text></Pressable></View></View>; }} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 40, gap: 12 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EEE7DE" }, backText: { color: "#6E665E", fontSize: 31, marginTop: -4 }, nav: { color: "#2E2A25", fontSize: 16, fontWeight: "900" }, space: { width: 38 }, title: { color: "#2E2A25", fontSize: 24, lineHeight: 31, fontWeight: "900", marginTop: 24 }, subtitle: { color: "#786F67", fontSize: 13, lineHeight: 20, marginTop: 8 }, wifiSetting: { backgroundColor: "#EEEAE4", borderRadius: 17, padding: 14, marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, wifiOn: { backgroundColor: "#E7F6EB" }, wifiTitle: { color: "#5E564E", fontSize: 14, fontWeight: "900" }, wifiTitleOn: { color: "#33743F" }, wifiBody: { color: "#81786F", fontSize: 11, marginTop: 4, maxWidth: 245 }, wifiBodyOn: { color: "#5A7F63" }, wifiState: { color: "#766D65", fontSize: 12, fontWeight: "900" }, wifiStateOn: { color: "#33743F" }, storage: { backgroundColor: "#F5F2FF", borderRadius: 17, padding: 14, marginTop: 9 }, storageValue: { color: "#5D58B5", fontSize: 17, fontWeight: "900" }, storageLabel: { color: "#79728E", fontSize: 12, marginTop: 3 }, status: { backgroundColor: "#E7F6EB", borderRadius: 17, padding: 14, marginTop: 9 }, statusText: { color: "#367549", fontSize: 12, lineHeight: 18, fontWeight: "700" }, card: { backgroundColor: "#FFFFFF", borderRadius: 19, padding: 16, borderWidth: 1, borderColor: "#EEE7DE", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, cardText: { flex: 1, marginRight: 8 }, cardTitle: { color: "#2E2A25", fontSize: 15, fontWeight: "900" }, cardMeta: { color: "#7D746B", fontSize: 12, marginTop: 5 }, actions: { gap: 6, alignItems: "flex-end" }, download: { backgroundColor: "#F5803E", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, minWidth: 51, alignItems: "center" }, downloadText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, delete: { paddingVertical: 4, paddingHorizontal: 7 }, deleteText: { color: "#AF5D50", fontSize: 11, fontWeight: "900" }, progressTrack: { height: 6, borderRadius: 4, overflow: "hidden", backgroundColor: "#EFE9E1", marginTop: 9 }, progressFill: { height: "100%", backgroundColor: "#46A758", borderRadius: 4 } });
