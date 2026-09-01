import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { applyPinAttempt, DEFAULT_PIN_ACCESS_STATE, isPinLocked, isValidParentPin, type PinAccessState } from "./parent-security-rules";
import { logParentSecurityAction } from "./parent-security-log";

const PIN_KEY = "rabbit-parent-pin-v1";
const SESSION_KEY = "rabbit-parent-unlock-v1";
const POLICY_KEY = "rabbit-parent-pin-policy-v1";
type PinRecord = { salt: string; hash: string };
export type PinVerification = { success: boolean; reason?: "incorrect" | "locked" | "missing"; remainingAttempts?: number; lockedUntil?: number };

const secureGet = (key: string) => Platform.OS === "web" ? Promise.resolve(typeof window === "undefined" ? null : window.localStorage.getItem(key)) : SecureStore.getItemAsync(key);
const secureSet = (key: string, value: string) => Platform.OS === "web" ? Promise.resolve(typeof window !== "undefined" && window.localStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value);
const hashPin = (pin: string, salt: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
const loadPolicy = async (): Promise<PinAccessState> => { const raw = await AsyncStorage.getItem(POLICY_KEY); if (!raw) return DEFAULT_PIN_ACCESS_STATE; try { return { ...DEFAULT_PIN_ACCESS_STATE, ...JSON.parse(raw) }; } catch { return DEFAULT_PIN_ACCESS_STATE; } };
const savePolicy = async (state: PinAccessState) => { await AsyncStorage.setItem(POLICY_KEY, JSON.stringify(state)); return state; };

export const hasParentPin = async () => Boolean(await secureGet(PIN_KEY));
export const setParentPin = async (pin: string) => { if (!isValidParentPin(pin)) throw new Error("请设置4位数字PIN码。"); const existed = await hasParentPin(); const salt = Crypto.randomUUID(); const hash = await hashPin(pin, salt); await secureSet(PIN_KEY, JSON.stringify({ salt, hash } satisfies PinRecord)); await savePolicy(DEFAULT_PIN_ACCESS_STATE); if (existed) await logParentSecurityAction("pin_changed"); return unlockParentSession(); };
export const getParentPinAccessState = loadPolicy;
export const verifyParentPin = async (pin: string): Promise<PinVerification> => {
  const policy = await loadPolicy();
  if (isPinLocked(policy)) return { success: false, reason: "locked", lockedUntil: policy.lockedUntil };
  const raw = await secureGet(PIN_KEY);
  if (!raw) return { success: false, reason: "missing" };
  try {
    const record = JSON.parse(raw) as PinRecord;
    const valid = (await hashPin(pin, record.salt)) === record.hash;
    const nextPolicy = await savePolicy(applyPinAttempt(policy, valid));
    if (valid) { await unlockParentSession(); return { success: true }; }
    return isPinLocked(nextPolicy) ? { success: false, reason: "locked", lockedUntil: nextPolicy.lockedUntil } : { success: false, reason: "incorrect", remainingAttempts: 5 - nextPolicy.failedAttempts };
  } catch { return { success: false, reason: "missing" }; }
};
export const unlockParentSession = async () => { const expiry = Date.now() + 10 * 60 * 1000; await AsyncStorage.setItem(SESSION_KEY, `${expiry}`); return expiry; };
export const isParentSessionUnlocked = async () => Number(await AsyncStorage.getItem(SESSION_KEY) ?? 0) > Date.now();
export const lockParentSession = async () => { await AsyncStorage.removeItem(SESSION_KEY); await logParentSecurityAction("parent_locked"); };
export const setBiometricUnlockEnabled = async (enabled: boolean) => { const policy = await loadPolicy(); const result = await savePolicy({ ...policy, biometricEnabled: enabled }); await logParentSecurityAction(enabled ? "biometric_enabled" : "biometric_disabled"); return result; };
export const canUseBiometricUnlock = async () => Platform.OS !== "web" && (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
export const isBiometricUnlockAvailable = async () => { const policy = await loadPolicy(); return policy.biometricEnabled && await canUseBiometricUnlock(); };
export const authenticateParentBiometric = async () => { const policy = await loadPolicy(); if (!policy.biometricEnabled || !(await canUseBiometricUnlock())) return false; const result = await LocalAuthentication.authenticateAsync({ promptMessage: "验证家长身份", promptDescription: "解锁家长模式", disableDeviceFallback: true, requireConfirmation: true }); if (result.success) await unlockParentSession(); return result.success; };
