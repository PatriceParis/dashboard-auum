import fs from "fs";
import path from "path";
import { LemlistAPIClient } from "./lemlist-api-client";
import type { LemlistCampaign, LemlistCampaignStats, LemlistDailyActivity, AbxStats } from "../src/lib/types";

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
  "linkedinInviteDone",
  "linkedinInviteAccepted",
  "linkedinSent",
  "linkedinReplied",
] as const;

// Map activity type → stats field
const TYPE_TO_FIELD: Record<string, keyof Omit<LemlistCampaignStats, "campaignId" | "campaignName">> = {
  emailsSent: "sent",
  emailsOpened: "opened",
  emailsClicked: "clicked",
  emailsReplied: "replied",
  emailsBounced: "bounced",
  linkedinInviteDone: "liInvites",
  linkedinInviteAccepted: "liAccepted",
  linkedinSent: "liSent",
  linkedinReplied: "liReplied",
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
      liInvites: 0,
      liAccepted: 0,
      liSent: 0,
      liReplied: 0,
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
          liInvites: 0,
          liAccepted: 0,
          liSent: 0,
          liReplied: 0,
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

  // 3. Fetch ABX status from contacts
  console.log("\n3. Fetching ABX Statut du lead from contacts...");
  const abxStats: AbxStats = { total: 0, mql: 0, sql: 0, deal: 0 };
  const seenContactIds = new Set<string>();

  // Possible field names for "ABX Statut du lead"
  const ABX_FIELD_PATTERNS = ["abx", "statut"];

  for (const campaign of campaigns) {
    const leads = await client.getLeads(campaign.id);
    for (const lead of leads) {
      if (seenContactIds.has(lead.contactId)) continue;
      seenContactIds.add(lead.contactId);
    }
  }

  console.log(`  Unique contacts across all campaigns: ${seenContactIds.size}`);
  abxStats.total = seenContactIds.size;

  // Fetch contacts in batches to check for ABX field
  let checked = 0;
  for (const contactId of seenContactIds) {
    try {
      const contact = await client.getContact(contactId);
      checked++;
      if (checked % 100 === 0) {
        console.log(`    Checked ${checked}/${seenContactIds.size} contacts...`);
      }

      const fields = contact.fields || {};
      // Find the ABX field: look for any field key containing "abx" or "statut"
      for (const [key, value] of Object.entries(fields)) {
        const keyLower = key.toLowerCase();
        if (ABX_FIELD_PATTERNS.some((p) => keyLower.includes(p)) && typeof value === "string") {
          const valLower = value.toLowerCase().trim();
          if (valLower === "mql") abxStats.mql++;
          else if (valLower === "sql") abxStats.sql++;
          else if (valLower === "deal") abxStats.deal++;
        }
      }
    } catch {
      // Skip contacts that can't be fetched
    }
  }

  console.log(`  ABX Stats: total=${abxStats.total}, MQL=${abxStats.mql}, SQL=${abxStats.sql}, Deal=${abxStats.deal}`);
  writeJSON("lemlist-abx-stats.json", abxStats);

  // 4. Summary
  const totalSent = campaignStats.reduce((s, c) => s + c.sent, 0);
  const totalOpened = campaignStats.reduce((s, c) => s + c.opened, 0);
  const totalReplied = campaignStats.reduce((s, c) => s + c.replied, 0);
  console.log(`\n  Summary: ${totalSent} sent, ${totalOpened} opened, ${totalReplied} replied`);

  // 5. Write timestamp
  writeJSON("lemlist-last-updated.json", { timestamp: new Date().toISOString() });

  console.log("\n✓ Lemlist data fetch complete!\n");
}

main().catch((err) => {
  console.error("\n✗ Lemlist fetch error:", err.message);
  // Don't exit with error - allow LinkedIn-only builds to succeed
  console.log("  Continuing without Lemlist data...");
});
