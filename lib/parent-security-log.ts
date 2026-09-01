import AsyncStorage from "@react-native-async-storage/async-storage";

const LOG_KEY = "rabbit-parent-security-log-v1";
const MAX_LOGS = 80;
export type ParentSecurityAction = "parent_locked" | "pin_changed" | "biometric_enabled" | "biometric_disabled" | "backup_exported" | "backup_restored" | "sync_created" | "sync_restored" | "recent_learning_cleared";
export type ParentSecurityLog = { id: string; action: ParentSecurityAction; createdAt: string };
export const loadParentSecurityLogs = async (): Promise<ParentSecurityLog[]> => { const raw = await AsyncStorage.getItem(LOG_KEY); if (!raw) return []; try { return JSON.parse(raw) as ParentSecurityLog[]; } catch { return []; } };
export const logParentSecurityAction = async (action: ParentSecurityAction) => { const current = await loadParentSecurityLogs(); const entry = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, action, createdAt: new Date().toISOString() }; const next = [entry, ...current].slice(0, MAX_LOGS); await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)); return next; };
export const clearParentSecurityLogs = () => AsyncStorage.removeItem(LOG_KEY);
