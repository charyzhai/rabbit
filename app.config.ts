import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const rawBundleId = "com.app.rabbitenglishquest";
const bundleId = rawBundleId
  .replace(/[-_]/g, ".")
  .replace(/[^a-zA-Z0-9.]/g, "")
  .replace(/\.+/g, ".")
  .replace(/^\.+|\.+$/g, "")
  .toLowerCase()
  .split(".")
  .map((segment) => (/^[a-zA-Z]/.test(segment) ? segment : `x${segment}`))
  .join(".") || "space.manus.app";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const env = {
  appName: "兔兔英语闯关",
  appSlug: "rabbit",
  logoUrl: "/manus-storage/rabbit-english-quest-icon_2efdeee1.png",
  scheme: `manus${timestamp}`,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  owner: "wencyzhais-team",   // 👈 添加这一行
  version: "1.0.5",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: { supportsTablet: true, bundleIdentifier: env.iosBundleId, infoPlist: { ITSAppUsesNonExemptEncryption: false } },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FFF9F0",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [{ action: "VIEW", autoVerify: true, data: [{ scheme: env.scheme, host: "*" }], category: ["BROWSABLE", "DEFAULT"] }],
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    ["expo-audio", { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." }],
    ["expo-video", { supportsBackgroundPlayback: true, supportsPictureInPicture: true }],
    ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#FFF9F0", dark: { backgroundColor: "#1C1917" } }],
    ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } }],
    ["expo-notifications", { defaultChannel: "review-reminders" }],
    ["expo-secure-store", { configureAndroidBackup: true }],
    ["expo-local-authentication", { faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID for parent mode." }],
    ["expo-camera", { cameraPermission: "Allow $(PRODUCT_NAME) to scan encrypted sync codes." }],
    "expo-document-picker",
    // 离线语音识别录音端：@siteed/audio-studio（Expo 原生模块，New Architecture 安全）。
    // 作用：录出 16kHz / 单声道 / 16-bit 的 WAV —— 这是 whisper.cpp 唯一接受的输入格式
    // （expo-audio 在 Android 上只能出 m4a）。插件主要负责补 RECORD_AUDIO 权限。
    "@siteed/audio-studio",
    // 离线语音识别（Whisper / whisper.cpp，JNI 推理，模型打包进 APK）。
    // 模型文件需放在 assets/models/ggml-tiny.en.bin（见 assets/MODEL_SETUP.md）。
    // 该文件缺失时插件仅 warn 并跳过拷贝，不会中断构建；运行时自动回退到本地启发式评分。
    "./plugins/with-whisper-model",
  ],
  extra: {
    eas: {
      projectId: "56cdf048-4d83-42fc-b25f-4d9c1ab0e832"
    }
  },
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
