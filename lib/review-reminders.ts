import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { LearningProgress } from "./learning-progress";
import { dueReviewIds, nextDueDate } from "./review-schedule";

const SETTINGS_KEY = "rabbit-review-reminder-settings-v1";
export type ReminderSettings = { enabled: boolean; hour: number; minute: number; notificationId: string | null };
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, hour: 19, minute: 0, notificationId: null };

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export const loadReminderSettings = async (): Promise<ReminderSettings> => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_REMINDER_SETTINGS;
  try { return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) }; } catch { return DEFAULT_REMINDER_SETTINGS; }
};
export const saveReminderSettings = async (settings: ReminderSettings) => { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return settings; };

const permissionReady = async () => {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("review-reminders", { name: "错题复习提醒", importance: Notifications.AndroidImportance.DEFAULT, vibrationPattern: [0, 160], lightColor: "#F5803E" });
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  return status === "granted";
};

export const scheduleNextReviewReminder = async (progress: LearningProgress, settings?: ReminderSettings) => {
  const activeSettings = settings ?? await loadReminderSettings();
  if (activeSettings.notificationId) await Notifications.cancelScheduledNotificationAsync(activeSettings.notificationId).catch(() => undefined);
  if (!activeSettings.enabled || !(await permissionReady())) return saveReminderSettings({ ...activeSettings, notificationId: null });
  const dueDate = nextDueDate(progress.reviewSchedule);
  if (!dueDate) return saveReminderSettings({ ...activeSettings, notificationId: null });
  const now = new Date();
  const target = new Date(`${dueDate}T00:00:00`);
  target.setHours(activeSettings.hour, activeSettings.minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const dueCount = dueReviewIds(progress.reviewSchedule, target.toISOString().slice(0, 10)).length;
  const notificationId = await Notifications.scheduleNotificationAsync({ content: { title: "兔兔提醒：复习时间到", body: `有 ${Math.max(dueCount, 1)} 个错题词汇在等你巩固。`, data: { url: "/(tabs)/review" } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target, channelId: "review-reminders" } });
  return saveReminderSettings({ ...activeSettings, notificationId });
};

export const disableReviewReminder = async () => { const settings = await loadReminderSettings(); if (settings.notificationId) await Notifications.cancelScheduledNotificationAsync(settings.notificationId).catch(() => undefined); return saveReminderSettings({ ...settings, enabled: false, notificationId: null }); };
