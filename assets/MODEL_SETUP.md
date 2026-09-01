# Whisper 离线语音识别（英文）

「兔兔英语闯关」的跟读评分已接入 **Whisper（`whisper.rn` → whisper.cpp，经 JNI 在端侧推理）**，
做**设备端真实语音识别（ASR）**：录完整段 → 识别出英文文本 → 用编辑距离算出发音相似度分。
模型随 App 打包进 APK，全程离线，音频不外传，不依赖任何后端。

## 架构一图流

```
麦克风
  │  @siteed/audio-studio
  │  16000Hz / 单声道 / pcm_16bit  →  带 WAV 头的文件
  ▼
whisper.rn（whisper.cpp，JNI 推理，模型在 APK assets 内）
  │  transcribe(wavUri, { language: "en" })
  ▼
识别文本 → shared/speech-scoring 编辑距离 → score / transcript / feedback
  │
  └─ 任一环节失败 → lib/local-speech-grade 启发式兜底
```

关键点：**whisper.cpp 只认 16kHz / 16-bit / 单声道 WAV（或裸 PCM），不解码 m4a/aac/mp3。**
`expo-audio` 在 Android 上只能录 m4a，所以录音端换成了 `@siteed/audio-studio`
（Expo 原生模块，New Architecture 安全，全平台输出 WAV PCM）。

## 1. 模型

当前使用 **`ggml-tiny.en.bin`（约 75MB）** —— 体积小、推理快，适合儿童短句跟读。

| 模型 | 体积 | 说明 |
| --- | --- | --- |
| **`ggml-tiny.en.bin`** | **~75 MB** | **当前使用：快，够用** |
| `ggml-base.en.bin` | ~142 MB | 更准，APK 大一圈、推理慢一些 |
| `ggml-small.en.bin` | ~460 MB | 手机端不推荐 |

> ⚠️ **模型不进 git 树**：`ggml-tiny.en.bin` 约 75MB，超过 GitHub 单文件 100MB 限制（且仓库规范不鼓励大文件），
> 已在 `.gitignore` 排除 `assets/models/*.bin`。模型由 `scripts/download-whisper-model.mjs`
> 在**构建时自动下载**，无需手动放进仓库、也无需 push 到 GitHub。

**本地 / 构建时拉取模型：**

```bash
# 本地手动拉（prebuild 前若 assets/models/ 下没有模型时跑一次）
pnpm ensure-model

# EAS 构建会自动执行：package.json 的 "eas-build-pre-install" 钩子在 expo prebuild 之前调用本脚本
eas build -p android --profile preview
```

下载源优先级：环境变量 `WHISPER_MODEL_URL` → 否则依次 HuggingFace 官方源 → `hf-mirror.com` 国内镜像（任一成功即采用，提高国内构建成功率）。

**默认下载源：HuggingFace 官方 `tiny.en`（开箱即用，无需 Release）**
当前 `eas.json` 不设 `WHISPER_MODEL_URL`，EAS 构建时钩子自动从
`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin` 下载，
构建机有外网即可，不必在 GitHub 建 Release。

**可选：用 GitHub Release 资产做自托管源**
> ⚠️ GitHub 网页上传 Release 资产有 **25MB 上限**，77MB 直接拖网页会 publish 失败；
> 必须走命令行：`gh release create v1.0.0 -t "whisper model" assets/models/ggml-tiny.en.bin`
> （gh CLI 走 API，可传最大 2GB）。先 `gh auth login`。
设置方式（构建环境）：

```bash
# 公开仓库：直接设下载地址
export WHISPER_MODEL_URL="https://github.com/<你>/<仓库>/releases/download/v1.0.0/ggml-tiny.en.bin"

# 私有仓库：再带一个 token（仅构建环境需要，勿写进代码）
export GH_TOKEN="<github_pat>"
#   EAS 云端构建时：把 GH_TOKEN 设为 EAS 项目 Secret（expo.dev 项目设置 → Secrets），
#   不要在代码或 eas.json 里硬编码。脚本检测到 GH_TOKEN 会自动走 GitHub API
#   按 tag 解析资产、拿到带签名的可下地址，规避 Release 直链 302 跳转丢鉴权的问题。
```

> 脚本逻辑：已存在且大小正常则跳过；下载到 `.part` 临时文件再原子改名；
> 多源回退（HF 直连失败自动换镜像）；对 `ggml-tiny.en.bin` **已内置 SHA256 校验**（无需设环境变量），
> 换其它模型可设 `WHISPER_MODEL_SHA256` 覆盖；下载同时做 `content-length` 大小守卫，截断即换下一源重试。

> **换模型要改三个地方**（文件名必须一致）：
> `assets/models/<文件>`、`lib/whisper-speech.ts` 的 `MODEL_FILE_NAME`、
> `plugins/with-whisper-model.js` 的 `DEFAULT_MODEL_FILE_NAME`。

## 2. 模型如何进 APK

`plugins/with-whisper-model.js` 在 `expo prebuild`（EAS 构建自动执行）时把模型拷进：

- Android：`android/app/src/main/assets/ggml-tiny.en.bin`
- iOS：`<AppName>/ggml-tiny.en.bin`

运行时 `whisper.rn` 以 `initWhisper({ filePath: "ggml-tiny.en.bin", isBundleAsset: true })`
加载，原生侧走 `AAssetManager` 从 APK 的 assets 目录读取。

> **模型文件缺失不会中断构建**：插件只打 warning 并跳过拷贝，
> App 会自动走启发式兜底评分，跟读功能照常可用。

## 3. 构建（Windows 本机无需 NDK/CMake）

```bash
pnpm install
eas build -p android --profile preview   # 或 production
```

- 首次构建要编译 whisper.cpp 与 audio-studio 的 C++ 代码，
  由 EAS 云端（Linux）完成，比普通 JS 构建慢几分钟，属正常。
- Windows 本机只负责改代码、装依赖、下载模型，不跑原生编译。

## 4. 验证是否真的在跑 Whisper

真机进入任意「跟读 / 开始朗读」页 → 录制 → 读英文 → 停止：

- **走 Whisper**：`识别到：` 后面是**真实的英文转写文本**（如 `hello how are you`），
  分数按与目标的编辑距离计算，通常会有明显浮动（读错词会扣分）。
- **走兜底**：转写固定显示 `（本地离线评分，未做语音转写）`，分数只有
  28 / 60 / 78 / 92 / 96 这几档。

看日志更快：

- `[whisper] 模型加载失败…` → 模型没进 APK，走兜底。
- `[useSpeechGrade] @siteed/audio-studio 不可用…` → 原生录音模块没编进去，走 expo-audio + 兜底。
- `[useSpeechGrade] Whisper 识别失败，改用启发式：` → 模型在但推理出错，走兜底。

> 界面上的「🎧 正在听：…」**不会显示文字**：`whisper.rn@0.7.4` 只有整段识别 API，
> 没有实时流式转写，`partial` 恒为空串。想做实时字幕需要等上游发布 `transcribeRealtime`。

## 5. 体积与隐私

- APK 增大约 75MB（tiny 模型）。
- 全部在设备端完成，音频不外传，符合儿童应用的隐私预期。
- 首次识别需要把模型从 assets 加载进内存（tiny 约 1-2 秒），之后复用同一个 context。
