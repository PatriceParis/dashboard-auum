import type { DashboardData } from "./types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STATIC_DIR = path.join(process.cwd(), "data-static");

function readJSON<T>(filename: string, fallback: T): T {
  // Try data/ first (build-time generated), then data-static/ (committed fallback)
  for (const dir of [DATA_DIR, STATIC_DIR]) {
    const filepath = path.join(dir, filename);
    try {
      const raw = fs.readFileSync(filepath, "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      // continue to next directory
    }
  }
  return fallback;
}

export function loadDashboardData(): DashboardData {
  const meta = readJSON("last-updated.json", { timestamp: "", period: undefined } as any);
  const allCampaigns = readJSON("campaigns.json", []) as DashboardData["campaigns"];
  const activeCampaigns = allCampaigns.filter((c) => c.status === "ACTIVE");
  const activeCampaignIds = new Set(activeCampaigns.map((c) => c.id));

  return {
    campaignGroups: readJSON("campaign-groups.json", []),
    campaigns: activeCampaigns,
    analytics: (readJSON("analytics.json", []) as DashboardData["analytics"]).filter(
      (a) => activeCampaignIds.has(a.campaignId)
    ),
    dailyAnalytics: (readJSON("daily-analytics.json", []) as DashboardData["dailyAnalytics"]).filter(
      (d) => activeCampaignIds.has(d.campaignId)
    ),
    creatives: (readJSON("creatives.json", []) as DashboardData["creatives"]).filter(
      (cr) => activeCampaignIds.has(cr.campaignId)
    ),
    lastUpdated: meta.timestamp,
    dataPeriod: meta.period,
    lemlist: {
      campaigns: readJSON("lemlist-campaigns.json", []),
      campaignStats: readJSON("lemlist-campaign-stats.json", []),
      dailyActivities: readJSON("lemlist-daily-activities.json", []),
      abxStats: readJSON("lemlist-abx-stats.json", { total: 0, mql: 0, sql: 0, deal: 0 }),
      lastUpdated: readJSON("lemlist-last-updated.json", { timestamp: "" } as any).timestamp,
    },
    abx: (() => {
      const companies = readJSON("abx-companies.json", null);
      const summary = readJSON("abx-summary.json", null);
      if (!companies || !summary) return undefined;
      return { companies, summary };
    })(),
  };
}
