/**
 * 本地离线跟读评分（无需后端 / 可打包进 App）
 * --------------------------------------------------
 * 原云端 speech.grade 走 ManuS 沙箱，已于 2026-09-01 过期下线。
 * 这里提供纯 TS 的离线评分，作为兜底，保证「开始朗读 / 跟读」功能在
 * 没有任何网络与后端的情况下也能正常打分、推进学习进度。
 *
 * 评分原理（诚实说明）：
 *   纯 JS 包无法在设备端做真正的语音识别(ASR)，所以本评分不是逐词音素比对，
 *   而是基于录音「数据量 / 时长」估算孩子的「朗读投入度与清晰度」。
 *   - 静音检测：几乎没声音 → 低分 + 提示靠近麦克风。
 *   - 数据量：读得越久 / 越大声，压缩后文件越大 → 分数越高。
 *   - 时长（可选）：录音状态提供 durationMs 时，按目标句长度给更合理的区间分。
 *
 * 接入设备端 ASR（如 vosk-react-native）后，可把 scoreFromAudio 换成真实转写 +
 * 编辑距离，对外接口（LocalSpeechGradeInput / LocalSpeechGradeResult）保持不变。
 */

export interface LocalSpeechGradeInput {
  targetText: string;
  audioBase64: string;
  mimeType?: string;
  /** 可选：录音时长(ms)。由录音状态提供时启用，提升评分区分度。 */
  durationMs?: number;
}

export interface LocalSpeechGradeResult {
  score: number;
  transcript: string;
  feedback: string;
}

/** 计算 base64 字符串对应的原始字节数（兼容 data: 前缀与 padding） */
function base64ByteLength(b64: string): number {
  if (!b64) return 0;
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const stripped = clean.replace(/=+$/, "");
  return Math.floor((stripped.length * 3) / 4);
}

/**
 * 把未压缩音频的字节量折算成等效压缩字节量。
 * 阈值（约每词 3.5KB）是按压缩音频（~64kbps ≈ 8000 B/s）标定的；
 * WAV 16kHz/16-bit/单声道 = 32000 B/s，是压缩音频的 4 倍，
 * 直接比较会把分数顶到天花板，所以先除以 4 再参与评分。
 */
function normalizeBytes(bytes: number, mimeType?: string): number {
  const mt = (mimeType ?? "").toLowerCase();
  if (mt.includes("wav") || mt.includes("pcm") || mt.includes("x-wav")) {
    return bytes / 4;
  }
  return bytes;
}

/** 基于录音数据量（已含时长/响度信息）的评分 */
function scoreFromSize(bytes: number, wordCount: number): number {
  // 期望字节随句子长度增长（约每词 3.5KB，按 ~64kbps 估算）
  const expectedBytes = Math.max(3500, wordCount * 3500);
  const ratio = bytes / expectedBytes;
  if (ratio >= 1.4) return 96;
  if (ratio >= 0.8) return 92;
  if (ratio >= 0.4) return 78;
  return 60;
}

/** 基于录音时长的评分（可选） */
function scoreFromDuration(durationMs: number, wordCount: number): number {
  const expectedMs = Math.min(12000, Math.max(1500, wordCount * 650));
  const ratio = durationMs / expectedMs;
  if (ratio >= 1.8) return 74; // 读得太久（拖长 / 重复）
  if (ratio >= 1.2) return 95;
  if (ratio >= 0.8) return 100; // 最理想区间
  if (ratio >= 0.5) return 86;
  if (ratio >= 0.3) return 66;
  return 36; // 几乎没读
}

function buildFeedback(score: number): string {
  if (score >= 90) return "读得很棒，发音清晰！继续保持 🌟";
  if (score >= 75) return "读得不错，再练几遍会更流利。";
  if (score >= 55) return "听到了，再大声、慢一点会更清楚。";
  return "读得有点短，把句子完整读出来会更好。";
}

export function gradeSpeechLocally(input: LocalSpeechGradeInput): LocalSpeechGradeResult {
  const target = (input.targetText ?? "").toString().trim();
  const wordCount = target ? target.split(/\s+/).filter(Boolean).length : 1;

  const rawBytes = base64ByteLength(input.audioBase64 ?? "");
  const bytes = normalizeBytes(rawBytes, input.mimeType);
  const durationMs =
    typeof input.durationMs === "number" && input.durationMs > 0 ? input.durationMs : 0;

  // 1) 静音检测：几乎没声音 → 直接低分
  if (bytes < 1000) {
    return {
      score: 28,
      transcript: "（没有检测到声音）",
      feedback: "没听到声音，请靠近麦克风再读一次。",
    };
  }

  // 2) 数据量评分
  const sizeScore = scoreFromSize(bytes, wordCount);

  // 3) 时长评分（仅当录音状态提供 durationMs 时启用）
  let score: number;
  if (durationMs > 0) {
    const durationScore = scoreFromDuration(durationMs, wordCount);
    score = Math.round(0.6 * durationScore + 0.4 * sizeScore);
  } else {
    score = sizeScore;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    transcript: "（本地离线评分，未做语音转写）",
    feedback: buildFeedback(score),
  };
}
