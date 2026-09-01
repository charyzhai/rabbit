/**
 * Custom environment loader that prioritizes system environment variables
 * over .env file values. This ensures that Manus platform-injected variables
 * are not overridden by placeholder values in .env
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");

  lines.forEach((line) => {
    // Skip comments and empty lines
    if (!line || line.trim().startsWith("#")) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ""); // Remove quotes

      // Only set if not already defined in environment
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Map system variables to Expo public variables
const mappings = {
  VITE_APP_ID: "EXPO_PUBLIC_APP_ID",
  VITE_OAUTH_PORTAL_URL: "EXPO_PUBLIC_OAUTH_PORTAL_URL",
  OAUTH_SERVER_URL: "EXPO_PUBLIC_OAUTH_SERVER_URL",
  OWNER_OPEN_ID: "EXPO_PUBLIC_OWNER_OPEN_ID",
  OWNER_NAME: "EXPO_PUBLIC_OWNER_NAME",
};

// Load Expo public variables from .project-config.json (Manus project config).
// This file carries the real API base URL / OAuth settings used by the deployed
// backend. It is read ONLY at build time to populate process.env; secrets are
// never forwarded to the client bundle. This makes local builds (EAS / Android
// Studio) resolve the same values the Manus platform injects at deploy time, so
// the tRPC client gets an absolute API URL instead of a relative one (which
// fails on native with "Invalid URL").
const projectConfigPath = path.resolve(process.cwd(), ".project-config.json");
if (fs.existsSync(projectConfigPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(projectConfigPath, "utf8"));
    const secrets = cfg.secrets || {};
    // Only surface safe keys: EXPO_PUBLIC_* (safe to embed in the client
    // bundle) plus the source vars referenced by `mappings` below. Never
    // forward real secrets (DATABASE_URL, JWT_SECRET, API keys, etc.).
    const safeKeys = new Set([
      ...Object.keys(mappings),
      ...Object.keys(secrets).filter((key) => key.startsWith("EXPO_PUBLIC_")),
    ]);
    for (const [key, value] of Object.entries(secrets)) {
      if (safeKeys.has(key) && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore malformed config
  }
}

for (const [systemVar, expoVar] of Object.entries(mappings)) {
  if (process.env[systemVar] && !process.env[expoVar]) {
    process.env[expoVar] = process.env[systemVar];
  }
}
