import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer } from "expo-audio";
import * as Network from "expo-network";
import { Directory, File, Paths } from "expo-file-system";

export type WordAudioMeta = { word: string; phonetic: string; audioUrl: string | null; offlineUri?: string | null; source: "online-audio" | "device-fallback"; cachedAt: string };
export type AudioHealth = { state: "offline-ready" | "online-ready" | "offline" | "unavailable"; label: string };

const CACHE_PREFIX = "rabbit-word-audio-v1:";
let activePlayer: ReturnType<typeof createAudioPlayer> | null = null;

export const getCachedWordAudio = async (word: string): Promise<WordAudioMeta | null> => {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${word.toLowerCase()}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as WordAudioMeta; } catch { return null; }
};

export const cacheWordAudio = async (meta: WordAudioMeta) => {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${meta.word.toLowerCase()}`, JSON.stringify(meta));
  return meta;
};

export const playOnlineAudio = (url: string) => {
  activePlayer?.remove();
  activePlayer = createAudioPlayer(url);
  activePlayer.play();
};

export const stopOnlineAudio = () => { activePlayer?.remove(); activePlayer = null; };

export const checkAudioHealth = async (meta: WordAudioMeta): Promise<AudioHealth> => {
  if (meta.offlineUri) { const file = new File(meta.offlineUri); if (file.exists) return { state: "offline-ready", label: "离线可播" }; }
  if (!meta.audioUrl) return { state: "unavailable", label: "设备发音" };
  const network = await Network.getNetworkStateAsync().catch(() => null);
  if (!network?.isInternetReachable) return { state: "offline", label: "等待网络" };
  try { const response = await fetch(meta.audioUrl, { method: "HEAD" }); return response.ok ? { state: "online-ready", label: "在线可播" } : { state: "unavailable", label: "来源暂不可用" }; } catch { return { state: "unavailable", label: "来源暂不可用" }; }
};

export const downloadOfflineAudio = async (meta: WordAudioMeta) => {
  if (!meta.audioUrl) throw new Error("该词暂未提供在线示范音频。");
  const directory = new Directory(Paths.document, "rabbit-word-audio");
  directory.create({ idempotent: true, intermediates: true });
  const output = await File.downloadFileAsync(meta.audioUrl, directory);
  const next = { ...meta, offlineUri: output.uri, cachedAt: new Date().toISOString() };
  await cacheWordAudio(next);
  return next;
};

export type OfflineAudioStats = { count: number; bytes: number };
export const getOfflineAudioStats = async (): Promise<OfflineAudioStats> => {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(CACHE_PREFIX));
  let count = 0; let bytes = 0;
  for (const key of keys) { const raw = await AsyncStorage.getItem(key); if (!raw) continue; try { const meta = JSON.parse(raw) as WordAudioMeta; if (!meta.offlineUri) continue; const file = new File(meta.offlineUri); if (file.exists) { count += 1; bytes += file.size ?? 0; } } catch { /* Ignore stale cache entries. */ } }
  return { count, bytes };
};

export const removeOfflineAudioForWords = async (words: string[]) => {
  let removed = 0;
  for (const word of words) { const meta = await getCachedWordAudio(word); if (!meta?.offlineUri) continue; try { const file = new File(meta.offlineUri); if (file.exists) file.delete(); await cacheWordAudio({ ...meta, offlineUri: null, cachedAt: new Date().toISOString() }); removed += 1; } catch { /* Keep stale metadata if the local file was already removed. */ } }
  return removed;
};
