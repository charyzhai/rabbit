import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { Platform } from "react-native";

const SETTINGS_KEY = "rabbit-audio-download-settings-v1";
export type DownloadSettings = { wifiOnly: boolean };
export const DEFAULT_DOWNLOAD_SETTINGS: DownloadSettings = { wifiOnly: true };
export const loadDownloadSettings = async (): Promise<DownloadSettings> => { const raw = await AsyncStorage.getItem(SETTINGS_KEY); if (!raw) return DEFAULT_DOWNLOAD_SETTINGS; try { return { ...DEFAULT_DOWNLOAD_SETTINGS, ...JSON.parse(raw) }; } catch { return DEFAULT_DOWNLOAD_SETTINGS; } };
export const saveDownloadSettings = async (settings: DownloadSettings) => { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return settings; };
export const canStartAudioDownload = async (settings: DownloadSettings) => {
  if (!settings.wifiOnly || Platform.OS === "web") return { allowed: true, reason: "" };
  const state = await Network.getNetworkStateAsync().catch(() => null);
  if (state?.isInternetReachable && state.type === Network.NetworkStateType.WIFI) return { allowed: true, reason: "" };
  return { allowed: false, reason: "已开启仅Wi‑Fi下载。请连接Wi‑Fi后再下载，或在此页关闭该开关。" };
};
