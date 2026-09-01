import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCES_KEY = "rabbit-learning-preferences-v1";

export type LearningPreferences = { autoAdvanceOnCorrect: boolean };

export const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = { autoAdvanceOnCorrect: false };

export const normalizeLearningPreferences = (value: Partial<LearningPreferences> | null | undefined): LearningPreferences => ({
  ...DEFAULT_LEARNING_PREFERENCES,
  ...value,
});

export const loadLearningPreferences = async (): Promise<LearningPreferences> => {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
  if (!raw) return DEFAULT_LEARNING_PREFERENCES;
  try { return normalizeLearningPreferences(JSON.parse(raw)); } catch { return DEFAULT_LEARNING_PREFERENCES; }
};

export const saveLearningPreferences = async (preferences: LearningPreferences) => {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  return preferences;
};
