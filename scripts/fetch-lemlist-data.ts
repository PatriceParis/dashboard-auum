import fs from "fs";
import path from "path";
import { LemlistAPIClient } from "./lemlist-api-client";
import type { LemlistCampaign, LemlistCampaignStats, LemlistDailyActivity } from "../src/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filename: string, data: unknown) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  console.log(`  ✓ Written ${filename}`);
}

const ACTIVITY_TYPES = [
  "emailsSent",
  "emailsOpened",
  "emailsClicked",
  "emailsReplied",
  "emailsBounced",
] as const;

// Map activity type → stats field
const TYPE_TO_FIELD: Record<string, keyof Omit<LemlistCampaignStats, "campaignId" | "campaignName">> = {
  emailsSent: "sent",
  emailsOpened: "opened",
  emailsClicked: "clicked",
  emailsReplied: "replied",
  emailsBounced: "bounced",
};

async function main() {
  console.log("\n=== Lemlist Data Fetch ===\n");
  console.log(`  LEMLIST_API_KEY set: ${!!process.env.LEMLIST_API_KEY}`);
  console.log();

  const client = new LemlistAPIClient();

  // 1. Fetch campaigns
  console.log("1. Fetching campaigns...");
  const rawCampaigns = await client.getCampaigns();
  const activeCampaigns = rawCampaigns.filter((c) => c.status === "running");
  const campaigns: LemlistCampaign[] = activeCampaigns.map((c) => ({
    id: c._id,
    name: c.name,
    status: c.status,
    labels: c.labels || [],
    createdAt: c.createdAt,
  }));
  console.log(`  Found ${campaigns.length} active campaigns (${rawCampaigns.length} total)`);
  campaigns.forEach((c) => console.log(`    - ${c.name} [${c.labels.join(", ")}]`));
  writeJSON("lemlist-campaigns.json", campaigns);

  // 2. Fetch activities per campaign
  console.log("\n2. Fetching activities per campaign...");
  const campaignStats: LemlistCampaignStats[] = [];
  const dailyMap = new Map<string, LemlistDailyActivity>();

  for (const campaign of campaigns) {
    console.log(`\n  Campaign: ${campaign.name}`);
    const stats: LemlistCampaignStats = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      interested: 0,
    };

    for (const type of ACTIVITY_TYPES) {
      const activities = await client.getAllActivities(campaign.id, type);
      const field = TYPE_TO_FIELD[type];
      stats[field] = activities.length;
      console.log(`    ${type}: ${activities.length}`);

      // Aggregate daily counts
      for (const act of activities) {
        if (!act.createdAt) continue;
        const date = act.createdAt.substring(0, 10); // YYYY-MM-DD
        const key = `${date}_${campaign.id}`;
        const existing = dailyMap.get(key) || {
          date,
          campaignId: campaign.id,
          sent: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          bounced: 0,
        };
        (existing as any)[field] += 1;
        dailyMap.set(key, existing);
      }
    }

    // Count interested leads via replied activities flagged as interested
    // (interested = replied leads that were marked as interested)
    try {
      const interestedActivities = await client.getAllActivities(campaign.id, "emailsInterested");
      stats.interested = interestedActivities.length;
      console.log(`    interested: ${stats.interested}`);
    } catch {
      console.log(`    interested: (not available)`);
    }

    campaignStats.push(stats);
  }

  writeJSON("lemlist-campaign-stats.json", campaignStats);

  // Sort daily activities by date
  const dailyActivities = Array.from(dailyMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
  writeJSON("lemlist-daily-activities.json", dailyActivities);

  // 3. Summary
  const totalSent = campaignStats.reduce((s, c) => s + c.sent, 0);
  const totalOpened = campaignStats.reduce((s, c) => s + c.opened, 0);
  const totalReplied = campaignStats.reduce((s, c) => s + c.replied, 0);
  console.log(`\n  Summary: ${totalSent} sent, ${totalOpened} opened, ${totalReplied} replied`);

  // 4. Write timestamp
  writeJSON("lemlist-last-updated.json", { timestamp: new Date().toISOString() });

  console.log("\n✓ Lemlist data fetch complete!\n");
}

main().catch((err) => {
  console.error("\n✗ Lemlist fetch error:", err.message);
  // Don't exit with error - allow LinkedIn-only builds to succeed
  console.log("  Continuing without Lemlist data...");
});
