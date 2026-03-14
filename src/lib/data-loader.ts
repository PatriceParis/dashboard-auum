import type { DashboardData } from "./types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function readJSON<T>(filename: string, fallback: T): T {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadDashboardData(): DashboardData {
  const meta = readJSON("last-updated.json", { timestamp: "", period: undefined } as any);
  return {
    campaignGroups: readJSON("campaign-groups.json", []),
    campaigns: readJSON("campaigns.json", []),
    analytics: readJSON("analytics.json", []),
    dailyAnalytics: readJSON("daily-analytics.json", []),
    creatives: readJSON("creatives.json", []),
    lastUpdated: meta.timestamp,
    dataPeriod: meta.period,
  };
}
