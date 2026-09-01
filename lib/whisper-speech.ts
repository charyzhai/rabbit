/**
 * whisper-speech.ts
 * --------------------------------------------------
 * Whisper（whisper.cpp，经 JNI/JSI 在端侧推理）离线语音识别封装。
 *
 * 设计要点：
 *   1) 动态 import whisper.rn —— 避免原生模块未链接（Expo Go / web / 未 prebuild）
 *      时“导入即崩溃”。whisper.rn 是 JSI 模块，缺失时捕获异常并交回退逻辑处理。
 *   2) 模型通过配置插件（plugins/with-whisper-model.js）拷进 APK 的 assets 目录，
 *      运行时按文件名 + isBundleAsset 加载（原生侧走 AAssetManager，已验证可用）；
 *      文件缺失则 initWhisper 抛错，回退启发式。
 *   3) 0.7.4 版本只提供「整段识别」：whisperContext.transcribe(wavUri, {language})。
 *      whisper.cpp 只认 16kHz / 16-bit / 单声道 WAV（或原始 PCM），不解码 m4a/aac。
 *      录音端由 @siteed/audio-studio 负责，配置为 16000Hz / 单声道 / pcm_16bit，
 *      原生侧直接写出带 WAV 头的文件，与 whisper.cpp 的要求完全对齐。
 *   4) 没有实时流式转写（0.7.4 无 transcribeRealtime），所以界面上的
 *      partial 恒为空串；评分是「录完整段 → 一次识别」。
 */

// 模型文件名：必须与 plugins/with-whisper-model.js 默认值一致，
// 也必须真实存在于 assets/models/ 下（由该插件拷进 APK assets）。
// 当前选用 tiny.en（约 75MB）：体积小、推理快，适合儿童短句跟读。
// 想换成 base.en（约 142MB，更准）时，把这里和插件默认值一起改，并放入对应文件。
const MODEL_FILE_NAME = "ggml-tiny.en.bin";
const WHISPER_MODULE_NAME = "whisper.rn";

type WhisperTranscribeResult = { result: string; language: string };

type WhisperContextLike = {
  transcribe: (
    filePathOrBase64: string | number,
    options?: unknown,
  ) => { stop: () => Promise<void>; promise: Promise<WhisperTranscribeResult> };
  release: () => Promise<void>;
};

let whisperModule: any = null;
let whisperModulePromise: Promise<any> | null = null;
let whisperContext: WhisperContextLike | null = null;

function loadWhisperModule(): Promise<any> {
  if (whisperModule) return Promise.resolve(whisperModule);
  if (whisperModulePromise) return whisperModulePromise;
  whisperModulePromise = (async () => {
    try {
      // 动态 import：模块缺失时不会让整个 app 崩溃
      return await import(WHISPER_MODULE_NAME);
    } catch (error) {
      console.warn("[whisper] 动态导入 whisper.rn 失败，将回退到本地启发式评分：", error);
      return null;
    }
  })();
  return whisperModulePromise;
}

/** 加载 Whisper 模型（带缓存）。返回模型是否可用。 */
export async function ensureWhisperModel(): Promise<boolean> {
  const mod = await loadWhisperModule();
  if (!mod || typeof mod.initWhisper !== "function") return false;
  if (whisperContext) return true;
  try {
    whisperContext = (await mod.initWhisper({
      filePath: MODEL_FILE_NAME,
      isBundleAsset: true,
    })) as WhisperContextLike;
    return true;
  } catch (error) {
    console.warn("[whisper] 模型加载失败（可能未放入 APK assets），回退启发式：", error);
    whisperContext = null;
    return false;
  }
}

/** 模型已加载即可用（录音端保证输出 WAV）。 */
export function isWhisperUsable(): boolean {
  return whisperContext !== null;
}

/**
 * 对一段 WAV（16kHz / 16-bit / 单声道）做离线识别。
 * @param wavUri  WAV 文件 URI（whisper.cpp 只认 WAV / 原始 PCM）
 * @returns 识别文本
 */
export async function transcribeWhisperFile(wavUri: string): Promise<string> {
  if (!whisperContext) throw new Error("Whisper 模型未加载");
  const { promise } = whisperContext.transcribe(wavUri, { language: "en" });
  const result = await promise;
  return (result?.result ?? "").trim();
}

/** 释放模型（可选；通常 App 生命周期内保留）。 */
export async function releaseWhisperModel(): Promise<void> {
  try {
    await whisperContext?.release();
  } catch {
    /* noop */
  }
  whisperContext = null;
}
