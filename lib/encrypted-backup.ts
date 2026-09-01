import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { bytesToHex, hexToBytes } from "@noble/ciphers/utils.js";
import { scrypt } from "@noble/hashes/scrypt.js";
import * as Crypto from "expo-crypto";
import type { FamilyState } from "./learning-progress";
import { validateFamilyBackup, type FamilyBackup } from "./family-backup-rules";

export type EncryptedBackupEnvelope = { version: 1; createdAt: string; salt: string; nonce: string; ciphertext: string };
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const deriveKey = (password: string, salt: Uint8Array) => scrypt(password.normalize("NFKC"), salt, { N: 2 ** 14, r: 8, p: 1, dkLen: 32, maxmem: 64 * 1024 * 1024 });
const verifyPassword = (password: string) => { if (password.trim().length < 8) throw new Error("备份密码至少需要8个字符，请设置更强的密码。"); };

export const encryptFamilyBackup = async (family: FamilyState, password: string): Promise<EncryptedBackupEnvelope> => {
  verifyPassword(password);
  const backup: FamilyBackup = { schemaVersion: 1, exportedAt: new Date().toISOString(), family };
  const salt = await Crypto.getRandomBytesAsync(16); const nonce = await Crypto.getRandomBytesAsync(24); const key = deriveKey(password, salt);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(encoder.encode(JSON.stringify(backup)));
  return { version: 1, createdAt: backup.exportedAt, salt: bytesToHex(salt), nonce: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext) };
};

export const decryptFamilyBackup = (envelope: EncryptedBackupEnvelope, password: string): FamilyBackup => {
  if (envelope.version !== 1 || !envelope.salt || !envelope.nonce || !envelope.ciphertext) throw new Error("加密备份格式无效。");
  try { const key = deriveKey(password, hexToBytes(envelope.salt)); const plain = xchacha20poly1305(key, hexToBytes(envelope.nonce)).decrypt(hexToBytes(envelope.ciphertext)); return validateFamilyBackup(JSON.parse(decoder.decode(plain))); } catch { throw new Error("密码不正确，或备份内容已损坏。" ); }
};

export const createSyncCode = async () => {
  const raw = bytesToHex(await Crypto.getRandomBytesAsync(10)).toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}`;
};
