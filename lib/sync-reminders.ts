import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const SYNC_REMINDER_KEY = "rabbit-sync-expiry-reminder-v1";
export type SyncExpiryReminder = { code: string; expiresAt: string; notificationId: string | null };
const notificationReady = async () => {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("sync-expiry", { name: "同步码到期提醒", importance: Notifications.AndroidImportance.DEFAULT, lightColor: "#5D58B5" });
  const permission = await Notifications.getPermissionsAsync();
  const status = permission.status === "granted" ? permission.status : (await Notifications.requestPermissionsAsync()).status;
  return status === "granted";
};
export const scheduleSyncExpiryReminder = async (code: string, expiresAt: Date): Promise<SyncExpiryReminder> => {
  const existing = await AsyncStorage.getItem(SYNC_REMINDER_KEY); if (existing) { try { const previous = JSON.parse(existing) as SyncExpiryReminder; if (previous.notificationId) await Notifications.cancelScheduledNotificationAsync(previous.notificationId).catch(() => undefined); } catch { /* Ignore stale settings. */ } }
  const target = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000);
  let notificationId: string | null = null;
  if (target > new Date() && await notificationReady()) notificationId = await Notifications.scheduleNotificationAsync({ content: { title: "兔兔提醒：同步码即将到期", body: "你创建的加密同步码将在24小时内失效；如仍需使用，请重新创建。", data: { url: "/cloud-sync" } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target, channelId: "sync-expiry" } });
  const reminder = { code, expiresAt: expiresAt.toISOString(), notificationId };
  await AsyncStorage.setItem(SYNC_REMINDER_KEY, JSON.stringify(reminder));
  return reminder;
};
export const loadSyncExpiryReminder = async (): Promise<SyncExpiryReminder | null> => { const raw = await AsyncStorage.getItem(SYNC_REMINDER_KEY); if (!raw) return null; try { return JSON.parse(raw) as SyncExpiryReminder; } catch { return null; } };
