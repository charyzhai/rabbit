// Patch @siteed/audio-studio Kotlin sources for expo-modules-core 3.x compatibility.
//
// Root cause: expo-modules-core 3.0.30 (Expo SDK 54) changed the `Promise.reject`
// interface signature from `reject(code: String?, ...)` (nullable code) to
// `reject(code: String, ...)` (non-null code). The library's anonymous
// `object : Promise { ... }` classes still use the old nullable signature, so they
// no longer implement the abstract interface method and `:siteed-audio-studio:
// compileReleaseKotlin` fails with "does not implement abstract member".
//
// This script rewrites the 19 affected `reject` overrides to the non-null signature.
// It runs in `postinstall` so it is applied automatically in both local and EAS
// cloud builds, after `pnpm install` lays down node_modules but before prebuild/gradle.
// It is idempotent: if the source is already patched (or the package is absent) it
// skips without error, so repeated installs are safe.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PKG = "@siteed/audio-studio";
const REL = ["android", "src", "main", "java", "net", "siteed", "audiostudio"];
const FILES = [
  "AudioStudioModule.kt",
  "AudioRecorderManager.kt",
  "AudioRecordingService.kt",
  "RecordingActionReceiver.kt",
];
const OLD = "reject(code: String?, message: String?, cause: Throwable?)";
const NEW = "reject(code: String, message: String?, cause: Throwable?)";

const base = join(process.cwd(), "node_modules", PKG, ...REL);

let patched = 0;
for (const file of FILES) {
  const p = join(base, file);
  if (!existsSync(p)) {
    console.log(`[patch-audio-studio] skip (package not installed): ${PKG}`);
    continue;
  }
  const text = readFileSync(p, "utf8");
  if (!text.includes(OLD)) {
    console.log(`[patch-audio-studio] already patched / N/A: ${file}`);
    continue;
  }
  writeFileSync(p, text.split(OLD).join(NEW), "utf8");
  patched++;
  console.log(`[patch-audio-studio] patched: ${file}`);
}
console.log(`[patch-audio-studio] done (${patched} file(s) changed)`);
