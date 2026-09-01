#!/usr/bin/env node
/**
 * download-whisper-model.mjs
 * --------------------------------------------------
 * 构建时（本地 prebuild / EAS build）拉取 Whisper 模型，使其不进 git 树，
 * 从而规避 GitHub 单文件 100MB 限制。
 *
 * 行为：
 *   - 目标落盘：<projectRoot>/assets/models/<WHISPER_MODEL_FILE，默认 ggml-tiny.en.bin>
 *   - 已存在且大小正常则跳过（省流量，也兼容本地已放好模型的场景）
 *   - 下载到临时文件再原子改名，避免半截文件被 with-whisper-model 插件拷进 APK
 *   - 默认对已知模型做 SHA256 校验（tiny.en 内置哈希；其它模型可设 WHISPER_MODEL_SHA256 覆盖）
 *   - 多源回退：默认依次尝试 HuggingFace 官方源 + 国内可达镜像 hf-mirror.com，
 *     任一成功即采用；用户显式设 WHISPER_MODEL_URL 时仅用该源（不走镜像）。
 *
 * 下载源优先级：
 *   1) 环境变量 WHISPER_MODEL_URL（用户自托管 / 私有 GitHub Release 资产，仅用此源）
 *   2) 否则：HuggingFace 官方 tiny.en → hf-mirror.com 镜像（回退）
 *
 * 鉴权：
 *   - 私有 GitHub 仓库的 Release 资产直链会 302 跳转到 objects.githubusercontent.com，
 *     跨域重定向不会自动带 Authorization，故设置 GH_TOKEN 时改为走 GitHub API
 *     （按 tag 定位资产，Accept: application/oct-stream 拿到带签名 token 的可下地址）。
 *   - 其它自定义 URL（如自托管）设置 GH_TOKEN 时会自动附带 Bearer 头。
 *
 * 在 EAS 中由 package.json 的 "eas-build-pre-install" 钩子在 expo prebuild
 * （配置插件拷贝模型）之前调用，保证 prebuild 时 assets/models/ 下已有模型。
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  statSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { open } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const MODEL_FILE = process.env.WHISPER_MODEL_FILE || "ggml-tiny.en.bin";
const MODEL_DIR = join(projectRoot, "assets", "models");
const DEST = join(MODEL_DIR, MODEL_FILE);
const TMP = DEST + ".part";

// 默认源 + 国内可达镜像。用户在国内，HuggingFace 直连可能不稳定，加镜像提高构建成功率。
const MIRRORS = [
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
  "https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
];

// 已知模型的内置 SHA256：未显式设 WHISPER_MODEL_SHA256 且文件名命中时，自动校验
// （换 base.en 等其它模型时，本表无对应项则跳过校验，或自行设 WHISPER_MODEL_SHA256）。
const KNOWN_SHA256 = {
  "ggml-tiny.en.bin": "921e4cf8686fdd993dcd081a5da5b6c365bfde1162e72b08d75ac75289920b1f",
};

const GH_TOKEN = process.env.GH_TOKEN || "";
const EXPECTED_SHA256 = (
  process.env.WHISPER_MODEL_SHA256 ||
  KNOWN_SHA256[MODEL_FILE] ||
  ""
).toLowerCase();

/**
 * 解析最终下载地址与请求头。
 * - 无 GH_TOKEN：原样返回（公开 HuggingFace / 公开 GitHub Release 均可用）。
 * - 有 GH_TOKEN 且是 github.com 的 Release 资产直链：
 *   走 GitHub API 按 tag 找到资产，返回其 API 资产地址 + Bearer 头 +
 *   Accept: application/octet-stream（GitHub 会 302 到带签名 token 的可下地址，
 *   跟随重定向时无需鉴权）。
 * - 有 GH_TOKEN 但非 GitHub Release 直链：附带 Bearer 头（自托管等场景）。
 */
async function resolveModelUrl(rawUrl) {
  if (!GH_TOKEN) return { url: rawUrl, headers: {} };

  const m = rawUrl.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/
  );
  if (!m) {
    return { url: rawUrl, headers: { Authorization: `Bearer ${GH_TOKEN}` } };
  }

  const [, owner, repo, tag, file] = m;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`;
  const relRes = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!relRes.ok) {
    console.error(
      `[whisper-model] 查询 Release(${tag}) 失败：HTTP ${relRes.status}（私有仓库需有效 GH_TOKEN）。`
    );
    process.exit(1);
  }
  const rel = await relRes.json();
  const asset = (rel.assets || []).find((a) => a.name === file);
  if (!asset) {
    console.error(`[whisper-model] Release(${tag}) 中找不到资产 "${file}"。`);
    process.exit(1);
  }
  // asset.url 是 API 资产地址；带 Accept: application/octet-stream 会 302 到签名直下地址
  return {
    url: asset.url,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/octet-stream",
    },
  };
}

// 已存在且看起来完整（>1MB）就跳过
if (existsSync(DEST) && statSync(DEST).size > 1_000_000) {
  const mb = (statSync(DEST).size / 1024 / 1024).toFixed(1);
  console.log(`[whisper-model] 已存在 ${DEST}（${mb} MB），跳过下载。`);
  process.exit(0);
}

mkdirSync(MODEL_DIR, { recursive: true });

// 用户显式指定源时只用该源；否则用默认源 + 镜像回退列表
const candidates = process.env.WHISPER_MODEL_URL
  ? [process.env.WHISPER_MODEL_URL]
  : MIRRORS;

let success = false;
let lastErr = "";

for (const rawUrl of candidates) {
  try {
    console.log(`[whisper-model] 尝试源: ${rawUrl}`);
    const { url: finalUrl, headers } = await resolveModelUrl(rawUrl);
    const res = await fetch(finalUrl, { redirect: "follow", headers });
    if (!res.ok || !res.body) {
      console.warn(`[whisper-model] HTTP ${res.status} ${res.statusText}，换下一源。`);
      lastErr = `HTTP ${res.status}`;
      continue;
    }

    const total = Number(res.headers.get("content-length") || 0);
    const hasher = createHash("sha256");
    let received = 0;

    const fh = await open(TMP, "w");
    try {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength) {
          await fh.write(value);
          hasher.update(value);
          received += value.byteLength;
          if (total) {
            const pct = ((received / total) * 100).toFixed(0);
            process.stdout.write(
              `\r[whisper-model] ${pct}%  (${(received / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB)`
            );
          }
        }
      }
    } finally {
      await fh.close();
    }
    if (total) process.stdout.write("\n");

    // 大小守卫：与 content-length 不一致说明下载被截断，换下一源
    if (total && received !== total) {
      console.warn(`[whisper-model] 大小不符（实际 ${received} != 期望 ${total}），换下一源。`);
      lastErr = "size mismatch";
      try { unlinkSync(TMP); } catch {}
      continue;
    }

    // SHA256 校验（默认对已知模型启用；也可 env 覆盖）
    if (EXPECTED_SHA256) {
      const actual = hasher.digest("hex");
      if (actual !== EXPECTED_SHA256) {
        console.error(`[whisper-model] SHA256 校验失败：期望 ${EXPECTED_SHA256}，实际 ${actual}。换下一源。`);
        lastErr = "sha256 mismatch";
        try { unlinkSync(TMP); } catch {}
        continue;
      }
      console.log(`[whisper-model] SHA256 校验通过。`);
    }

    renameSync(TMP, DEST);
    console.log(
      `[whisper-model] 完成：${DEST}（${(received / 1024 / 1024).toFixed(1)} MB）`
    );
    success = true;
    break;
  } catch (err) {
    console.warn(`[whisper-model] 下载失败：${err?.message || err}，换下一源。`);
    lastErr = err?.message || String(err);
    try { unlinkSync(TMP); } catch {}
    continue;
  }
}

if (!success) {
  console.error(`[whisper-model] 所有源均失败（最后错误：${lastErr}）。`);
  process.exit(1);
}
