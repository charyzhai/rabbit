import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/ciphers/utils.js";
import * as SecureStore from "expo-secure-store";
import { LICENSE_HASH_FRAG_A, LICENSE_PEPPER_FRAG_A } from "@/constants/license";

// ---- 混淆片段（与 constants/license.ts 中的片段拼合）----
// 激活码哈希的后 32 位
const LICENSE_HASH_FRAG_B = "f4fc2a791743f278adac5d3f92a72e39";
// 哈希盐（pepper）的后半段
const LICENSE_PEPPER_FRAG_B = "ivation-pepper-2026-v1";

// 运行时拼合，避免单一明文 / 完整哈希可直接被搜索到
const EXPECTED_HASH = LICENSE_HASH_FRAG_A + LICENSE_HASH_FRAG_B;
const PEPPER = LICENSE_PEPPER_FRAG_A + LICENSE_PEPPER_FRAG_B;

// 免费试用天数
export const TRIAL_DAYS = 3;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

const TRIAL_START_KEY = "rb_trial_start";
const ACT_TOKEN_KEY = "rb_act_token";

// 安全存储：原生平台使用 expo-secure-store（加密且设备绑定），Web 退化为 localStorage
const secureGet = (key: string) =>
  Platform.OS === "web"
    ? Promise.resolve(typeof window === "undefined" ? null : window.localStorage.getItem(key))
    : SecureStore.getItemAsync(key);
const secureSet = (key: string, value: string) =>
  Platform.OS === "web"
    ? Promise.resolve(typeof window !== "undefined" && window.localStorage.setItem(key, value))
    : SecureStore.setItemAsync(key, value);
const secureDelete = (key: string) =>
  Platform.OS === "web"
    ? Promise.resolve(typeof window !== "undefined" && window.localStorage.removeItem(key))
    : SecureStore.deleteItemAsync(key);

export type TrialStatus = {
  activated: boolean;
  trialStarted: boolean;
  expired: boolean;
  remainingMs: number; // 试用剩余毫秒；已激活为 Infinity
  remainingDays: number; // 向上取整的天数；已激活为 Infinity
};

// 对「激活码 + 盐」做 SHA-256，返回十六进制
function hashCode(input: string): string {
  return bytesToHex(sha256(input + PEPPER));
}

// 常量时间比较，降低计时侧信道风险
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// 记录首次启动时间（仅记一次），用于计算试用到期
export async function ensureTrialStart(): Promise<number> {
  const raw = await AsyncStorage.getItem(TRIAL_START_KEY);
  if (raw) {
    const t = Number(raw);
    if (!Number.isNaN(t) && t > 0) return t;
  }
  const now = Date.now();
  await AsyncStorage.setItem(TRIAL_START_KEY, String(now));
  return now;
}

// 综合状态：是否已激活 / 是否过期 / 剩余时间
export async function getTrialStatus(): Promise<TrialStatus> {
  const activated = await isActivated();
  if (activated) {
    return { activated: true, trialStarted: true, expired: false, remainingMs: Infinity, remainingDays: Infinity };
  }
  const start = await ensureTrialStart();
  const elapsed = Date.now() - start;
  const expired = elapsed >= TRIAL_MS;
  const remainingMs = Math.max(0, TRIAL_MS - elapsed);
  return {
    activated: false,
    trialStarted: true,
    expired,
    remainingMs,
    remainingDays: Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000))),
  };
}

// 是否已激活：比对加密存储中的派生令牌，而非简单布尔值
export async function isActivated(): Promise<boolean> {
  try {
    const token = await secureGet(ACT_TOKEN_KEY);
    if (!token) return false;
    return safeEqual(token, EXPECTED_HASH);
  } catch {
    return false;
  }
}

// 校验并写入激活状态；返回 true 表示激活成功
export async function activate(input: string): Promise<boolean> {
  const candidate = hashCode(input.trim());
  if (!safeEqual(candidate, EXPECTED_HASH)) return false;
  await secureSet(ACT_TOKEN_KEY, EXPECTED_HASH);
  return true;
}

// 清除激活状态（用于「退出激活 / 重置」场景）
export async function resetActivation(): Promise<void> {
  await secureDelete(ACT_TOKEN_KEY);
}
