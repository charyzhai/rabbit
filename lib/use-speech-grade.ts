/**
 * useSpeechGrade —— 跟读评分 Hook（Whisper 真实 ASR 主路径 + 本地启发式兜底）
 * --------------------------------------------------
 * 对外接口（三屏统一调用，任何引擎切换都不需要动 UI）：
 *   const grade = useSpeechGrade();
 *   await grade.startRecording();
 *   const result = await grade.stopAndGrade(targetText);
 *   // result: { score, transcript, feedback }
 *   grade.isRecording / grade.isPending / grade.partial
 *
 * 两条录音路径：
 *   A) WAV 路径（Whisper 真实识别）
 *      模型可用时启用。用 @siteed/audio-studio 按 16000Hz / 单声道 / pcm_16bit 录制，
 *      原生侧直接写出带 WAV 头的文件 —— 这正是 whisper.cpp 唯一接受的输入格式。
 *      录完交给 whisper.rn（whisper.cpp，JNI 推理）整段识别，
 *      再用 shared/speech-scoring 的编辑距离算出发音相似度分。
 *   B) expo-audio + 启发式兜底
 *      模型缺失 / 原生模块不可用 / 推理异常时自动降级。录 m4a，
 *      用 lib/local-speech-grade 基于数据量+时长估算分数，保证任何环境都能打分。
 *
 * 关于 partial（实时转写）：whisper.rn@0.7.4 只有「整段识别」API，
 * 没有实时流式转写，所以 partial 恒为空串；UI 上的「正在听」不会显示文字。
 */
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
// File 来自 expo-file-system（expo-audio 并不导出它），用于读取录音文件字节
import { File } from "expo-file-system";
import {
  ensureWhisperModel,
  isWhisperUsable,
  transcribeWhisperFile,
} from "@/lib/whisper-speech";
import {
  gradeSpeechLocally,
  type LocalSpeechGradeResult,
} from "@/lib/local-speech-grade";
import { calculatePronunciationScore } from "@/shared/speech-scoring";

export type SpeechGradeResult = LocalSpeechGradeResult;

/** whisper.cpp 要求的音频规格：16kHz / 单声道 / 16-bit，输出带 WAV 头的文件 */
const WHISPER_RECORDING_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  encoding: "pcm_16bit",
  // 只要波形文件，不做频谱分析，省 CPU
  enableProcessing: false,
  keepFullAnalysis: false,
  output: { primary: { enabled: true, format: "wav" } },
} as const;

type WavRecording = { fileUri?: string; durationMs?: number; size?: number };

type AudioStudioNativeModule = {
  startRecording: (config: Record<string, unknown>) => Promise<unknown>;
  stopRecording: () => Promise<WavRecording | null>;
};

let audioStudioPromise: Promise<AudioStudioNativeModule | null> | null = null;

/**
 * 惰性取 @siteed/audio-studio 的原生模块。
 * 该包在【导入时】就会 requireNativeModule('AudioStudio')，原生模块缺失会直接抛错，
 * 所以这里必须动态 import + try/catch，否则 Expo Go / 未 prebuild 环境会整个崩掉。
 */
function getAudioStudio(): Promise<AudioStudioNativeModule | null> {
  if (audioStudioPromise) return audioStudioPromise;
  audioStudioPromise = (async () => {
    try {
      const mod = await import("@siteed/audio-studio");
      const native = mod?.AudioStudioModule;
      if (native && typeof native.startRecording === "function") {
        return native as AudioStudioNativeModule;
      }
      console.warn("[useSpeechGrade] @siteed/audio-studio 原生模块为空，改用 expo-audio。");
      return null;
    } catch (error) {
      console.warn("[useSpeechGrade] @siteed/audio-studio 不可用，改用 expo-audio：", error);
      return null;
    }
  })();
  return audioStudioPromise;
}

export function useSpeechGrade() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [partial, setPartial] = useState("");
  // null = 尚未探测；true = Whisper 模型可用；false = 模型不可用
  const whisperReadyRef = useRef<boolean | null>(null);
  // 本次录音实际采用的路径："wav"（可喂 Whisper）| "expo"（m4a 兜底）| null
  const modeRef = useRef<"wav" | "expo" | null>(null);

  const startRecording = useCallback(async () => {
    setPartial("");
    setIsRecording(true);
    modeRef.current = null;

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要麦克风权限", "请允许麦克风权限，才能为跟读打分。");
      setIsRecording(false);
      return;
    }

    // 首次使用时探测 Whisper 模型是否可用（加载结果缓存到 ref）
    if (whisperReadyRef.current === null) {
      setIsPending(true);
      try {
        whisperReadyRef.current = await ensureWhisperModel();
      } catch {
        whisperReadyRef.current = false;
      } finally {
        setIsPending(false);
      }
    }

    // 模型可用 → 走 WAV 路径，录 whisper.cpp 能吃的格式
    if (whisperReadyRef.current) {
      const studio = await getAudioStudio();
      if (studio) {
        try {
          await studio.startRecording(
            WHISPER_RECORDING_CONFIG as unknown as Record<string, unknown>,
          );
          modeRef.current = "wav";
          return;
        } catch (error) {
          console.warn("[useSpeechGrade] WAV 录音启动失败，回退 expo-audio：", error);
        }
      }
    }

    // 兜底：expo-audio 录 m4a（启发式评分按压缩音频标定）
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      modeRef.current = "expo";
    } catch {
      setIsRecording(false);
    }
  }, [recorder]);

  const stopAndGrade = useCallback(
    async (targetText: string): Promise<SpeechGradeResult> => {
      setIsPending(true);
      try {
        // ---------- 路径 A：WAV 录音 ----------
        if (modeRef.current === null) {
          // 例如模型还在加载时就点了停止 —— 此刻两个录音器都还没启动
          throw new Error("录音还没开始，请重新录一遍。");
        }

        if (modeRef.current === "wav") {
          modeRef.current = null;
          const studio = await getAudioStudio();
          if (!studio) throw new Error("录音组件不可用，请重新录一遍。");

          const recording = (await studio.stopRecording()) as WavRecording | null;
          const wavUri = recording?.fileUri;
          if (!wavUri) throw new Error("录音未保存，请重新录一遍。");

          // A1：Whisper 真实识别（主路径）
          if (isWhisperUsable()) {
            try {
              const transcript = await transcribeWhisperFile(wavUri);
              if (transcript) {
                const pr = calculatePronunciationScore(targetText, transcript);
                return {
                  score: pr.score,
                  transcript,
                  feedback: pr.feedback,
                };
              }
              // 识别结果为空 = 基本没听清
              return {
                score: 30,
                transcript: "（未能识别到语音）",
                feedback: "没有听清，请靠近麦克风、放慢速度再读一次。",
              };
            } catch (error) {
              console.warn("[useSpeechGrade] Whisper 识别失败，改用启发式：", error);
            }
          }

          // A2：模型不可用或识别失败 → 启发式（WAV 未压缩，需按格式折算字节量）
          const wavFile = new File(wavUri);
          if (wavFile.size > 20_000_000) throw new Error("录音太长，请控制在30秒内。");
          return gradeSpeechLocally({
            targetText,
            audioBase64: await wavFile.base64(),
            mimeType: "audio/wav",
            durationMs: recording.durationMs,
          });
        }

        // ---------- 路径 B：expo-audio m4a + 启发式 ----------
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error("录音未保存，请重新录一遍。");
        const file = new File(uri);
        if (file.size > 6_000_000) throw new Error("录音太长，请控制在30秒内。");
        return gradeSpeechLocally({
          targetText,
          audioBase64: await file.base64(),
          mimeType: "audio/m4a",
        });
      } finally {
        setIsRecording(false);
        setIsPending(false);
        setPartial("");
      }
    },
    [recorder],
  );

  return { startRecording, stopAndGrade, isRecording, isPending, partial };
}
