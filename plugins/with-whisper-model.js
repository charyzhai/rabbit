/**
 * with-whisper-model —— 把 Whisper 模型文件拷进原生工程的 assets，使其打包进 APK/IPA。
 *
 * 用法（app.config.ts plugins 数组中）：
 *   "./plugins/with-whisper-model"
 *
 * 行为：
 *   - 模型源文件：<projectRoot>/assets/models/ggml-tiny.en.bin
 *   - Android 目标：<platformRoot>/app/src/main/assets/ggml-tiny.en.bin
 *   - iOS 目标：<platformRoot>/<AppName>/ggml-tiny.en.bin（随 App 资源打包）
 *   - 源文件【缺失时仅 warn 并跳过】，不会中断 prebuild / 构建；
 *     运行时 whisper.rn 加载失败会自动回退到本地启发式评分（lib/local-speech-grade）。
 *
 * 注意：whisper.rn 通过 AAssetManager 从 APK 的 assets 目录按文件名加载模型，
 * 因此 fileName 必须与 whisper-speech.ts 中的 MODEL_FILE_NAME 保持一致。
 */
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

// 当前用 tiny.en（约 75MB）。换 base.en（约 142MB，更准）时，
// 需同步改 lib/whisper-speech.ts 的 MODEL_FILE_NAME，并放入对应模型文件。
const DEFAULT_MODEL_FILE_NAME = "ggml-tiny.en.bin";

function copyModelIfPresent(projectRoot, sourceRel, destPath, label) {
  const src = path.join(projectRoot, sourceRel);
  if (!fs.existsSync(src)) {
    console.warn(
      `[with-whisper-model] 未找到模型文件 ${src}，跳过拷贝。运行时将自动回退到本地启发式评分。`
    );
    return;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(src, destPath);
  const sizeMb = (fs.statSync(destPath).size / (1024 * 1024)).toFixed(1);
  console.log(`[with-whisper-model] 已拷贝 Whisper 模型到 ${label}（${sizeMb} MB）`);
}

module.exports = function withWhisperModel(config, options = {}) {
  const modelFileName = options.modelFileName || DEFAULT_MODEL_FILE_NAME;
  const sourceRel = path.join("assets", "models", modelFileName);

  // Android：拷到 app/src/main/assets，随 APK 打包
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const { projectRoot, platformProjectRoot } = cfg.modRequest;
      const dest = path.join(platformProjectRoot, "app", "src", "main", "assets", modelFileName);
      copyModelIfPresent(projectRoot, sourceRel, dest, "android/app/src/main/assets");
      return cfg;
    },
  ]);

  // iOS：拷到 App 资源目录，随 IPA 打包
  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const { projectRoot, platformProjectRoot } = cfg.modRequest;
      const appName = cfg.modRequest.projectName || "app";
      const dest = path.join(platformProjectRoot, appName, modelFileName);
      copyModelIfPresent(projectRoot, sourceRel, dest, `ios/${appName}`);
      return cfg;
    },
  ]);

  return config;
};
