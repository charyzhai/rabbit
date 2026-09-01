import type { FamilyState } from "./learning-progress";

export type FamilyBackup = { schemaVersion: 1; exportedAt: string; family: FamilyState };
export const validateFamilyBackup = (value: unknown): FamilyBackup => {
  const backup = value as FamilyBackup;
  if (backup?.schemaVersion !== 1 || !backup.family?.profiles?.length || !backup.family.activeProfileId) throw new Error("备份文件格式不正确或不属于兔兔英语闯关。");
  return backup;
};
