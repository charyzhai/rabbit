import { useCallback, useEffect, useState } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

import { loadFeedbackSettings, saveFeedbackSettings } from "@/lib/feedback-settings";

export type FeedbackSound = "success" | "retry" | "complete";
export function useFeedbackSounds() {
  const success = useAudioPlayer(require("../assets/sounds/success.wav"));
  const retry = useAudioPlayer(require("../assets/sounds/retry.wav"));
  const complete = useAudioPlayer(require("../assets/sounds/complete.wav"));
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  useEffect(() => { loadFeedbackSettings().then((settings) => setSoundsEnabled(settings.soundsEnabled)); setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined); }, []);
  const play = useCallback((sound: FeedbackSound) => { if (!soundsEnabled) return; const player = sound === "success" ? success : sound === "retry" ? retry : complete; try { player.seekTo(0); player.play(); } catch { /* Audio never blocks learning feedback. */ } }, [complete, retry, soundsEnabled, success]);
  const toggleSounds = useCallback(async () => { const next = !soundsEnabled; setSoundsEnabled(next); await saveFeedbackSettings({ soundsEnabled: next }); return next; }, [soundsEnabled]);
  return { soundsEnabled, play, toggleSounds };
}
