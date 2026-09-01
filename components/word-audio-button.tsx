import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { trpc } from "@/lib/trpc";
import { cacheWordAudio, getCachedWordAudio, playOnlineAudio } from "@/lib/word-audio";
import { speakEnglish } from "@/lib/speech";

export function WordAudioButton({ word, initialPhonetic = "" }: { word: string; initialPhonetic?: string }) {
  const [phonetic, setPhonetic] = useState(initialPhonetic);
  const [source, setSource] = useState<"online-audio" | "device-fallback" | null>(null);
  const [loading, setLoading] = useState(false);
  const lookup = trpc.dictionary.lookup.useQuery({ word }, { enabled: false, retry: 0 });
  const play = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const cached = await getCachedWordAudio(word);
      if (cached) {
        setPhonetic(cached.phonetic || initialPhonetic); setSource(cached.source);
        if (cached.audioUrl) playOnlineAudio(cached.audioUrl); else await speakEnglish(word);
        return;
      }
      if (!/^[a-zA-Z-]+$/.test(word)) {
        const fallback = { word, phonetic: initialPhonetic, audioUrl: null, source: "device-fallback" as const, cachedAt: new Date().toISOString() };
        await cacheWordAudio(fallback); setSource(fallback.source); await speakEnglish(word); return;
      }
      const result = await lookup.refetch();
      const data = result.data;
      if (!data) throw new Error("未取得词典数据");
      const meta = { ...data, cachedAt: new Date().toISOString() };
      await cacheWordAudio(meta); setPhonetic(meta.phonetic || initialPhonetic); setSource(meta.source);
      if (meta.audioUrl) playOnlineAudio(meta.audioUrl); else await speakEnglish(word);
    } catch {
      setSource("device-fallback"); await speakEnglish(word);
    } finally { setLoading(false); }
  };
  return <View style={styles.wrap}><Pressable accessibilityRole="button" accessibilityLabel={`播放 ${word} 的示范发音`} onPress={play} style={styles.button}><Text style={styles.buttonText}>{loading ? "获取中" : "🔊 示范"}</Text></Pressable>{phonetic ? <Text style={styles.phonetic}>/{phonetic.replace(/^\/+|\/+$/g, "")}/</Text> : source === "device-fallback" ? <Text style={styles.fallback}>设备发音</Text> : <Text style={styles.hint}>点按获取音标</Text>}</View>;
}

const styles = StyleSheet.create({ wrap: { alignItems: "flex-end" }, button: { backgroundColor: "#FFF0D7", borderRadius: 11, paddingVertical: 7, paddingHorizontal: 10 }, buttonText: { color: "#A65B1B", fontSize: 12, fontWeight: "900" }, phonetic: { color: "#7E756D", fontSize: 11, marginTop: 4, maxWidth: 110 }, fallback: { color: "#A65B1B", fontSize: 10, marginTop: 4 }, hint: { color: "#9B9289", fontSize: 10, marginTop: 4 } });
