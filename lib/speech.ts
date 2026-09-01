import * as Speech from "expo-speech";

export const speakEnglish = async (text: string, slow = false) => {
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) await Speech.stop();
  Speech.speak(text, {
    language: "en-US",
    rate: slow ? 0.7 : 0.86,
    pitch: 1,
  });
};
