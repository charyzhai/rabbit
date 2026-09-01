import { File, Paths } from "expo-file-system";
import type { FamilyState } from "./learning-progress";
import { validateFamilyBackup, type FamilyBackup } from "./family-backup-rules";

export const createFamilyBackup = (family: FamilyState): FamilyBackup => ({ schemaVersion: 1, exportedAt: new Date().toISOString(), family });
export { validateFamilyBackup, type FamilyBackup } from "./family-backup-rules";
export const writeBackupFile = (backup: FamilyBackup) => { const file = new File(Paths.cache, `兔兔英语_儿童档案备份_${backup.exportedAt.slice(0, 10)}.json`); file.create({ overwrite: true, intermediates: true }); file.write(JSON.stringify(backup)); return file; };
