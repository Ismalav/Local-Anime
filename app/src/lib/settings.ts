import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

export interface AppSettings {
  sushiscan: {
    cfClearance: string;
    userAgent: string;
  };
}

const DEFAULTS: AppSettings = {
  sushiscan: { cfClearance: "", userAgent: "" },
};

export function getSettings(): AppSettings {
  try {
    if (!existsSync(SETTINGS_FILE)) return { ...DEFAULTS };
    const raw = readFileSync(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      sushiscan: {
        cfClearance: parsed.sushiscan?.cfClearance?.trim() ?? "",
        userAgent: parsed.sushiscan?.userAgent?.trim() ?? "",
      },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(patch: Partial<AppSettings>): void {
  const current = getSettings();
  const merged: AppSettings = {
    sushiscan: {
      ...current.sushiscan,
      ...(patch.sushiscan ?? {}),
    },
  };
  merged.sushiscan.cfClearance = merged.sushiscan.cfClearance.trim();
  merged.sushiscan.userAgent = merged.sushiscan.userAgent.trim();
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
}
