import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "rabbit-feedback-settings-v1";
export type FeedbackSettings = { soundsEnabled: boolean };
export const DEFAULT_FEEDBACK_SETTINGS: FeedbackSettings = { soundsEnabled: true };
export const loadFeedbackSettings = async (): Promise<FeedbackSettings> => { const raw = await AsyncStorage.getItem(SETTINGS_KEY); if (!raw) return DEFAULT_FEEDBACK_SETTINGS; try { return { ...DEFAULT_FEEDBACK_SETTINGS, ...JSON.parse(raw) }; } catch { return DEFAULT_FEEDBACK_SETTINGS; } };
export const saveFeedbackSettings = async (settings: FeedbackSettings) => { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return settings; };
export const feedbackSoundLabel = (enabled: boolean) => enabled ? "音效已开启" : "音效已关闭";
