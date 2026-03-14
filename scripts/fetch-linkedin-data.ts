import fs from "fs";
import path from "path";
import { LinkedInAPIClient } from "./api-client";
import { REGION_KEYWORDS } from "../src/lib/constants";
import type { Campaign, CampaignGroup, CampaignAnalytics, DailyAnalytics, Creative, Region } from "../src/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CREATIVES_DIR = path.join(process.cwd(), "public", "creatives");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filename: string, data: unknown) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  console.log(`  ✓ Written ${filename}`);
}

function detectRegion(groupName: string): Region {
  const lower = groupName.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return region as Region;
    }
  }
  return "Global";
}

async function downloadImage(url: string, filename: string): Promise<string> {
  ensureDir(CREATIVES_DIR);
  const filepath = path.join(CREATIVES_DIR, filename);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return `/creatives/${filename}`;
  } catch (err) {
    console.warn(`  ⚠ Failed to download image: ${err}`);
    return "";
  }
}

async function main() {
  console.log("\n=== LinkedIn Ads Data Fetch ===\n");
  console.log(`  Node version: ${process.version}`);
  console.log(`  LINKEDIN_ACCESS_TOKEN set: ${!!process.env.LINKEDIN_ACCESS_TOKEN}`);
  console.log(`  LINKEDIN_AD_ACCOUNT_ID: ${process.env.LINKEDIN_AD_ACCOUNT_ID || "(not set)"}`);
  console.log();

  const client = new LinkedInAPIClient();

  // 1. Get Ad Accounts
  console.log("1. Fetching ad accounts...");
  const accounts = await client.getAdAccounts();
  if (accounts.elements.length === 0) {
    console.error("No active ad accounts found.");
    process.exit(1);
  }

  const accountId = process.env.LINKEDIN_AD_ACCOUNT_ID
    ? parseInt(process.env.LINKEDIN_AD_ACCOUNT_ID.replace(/\D/g, ""), 10)
    : accounts.elements[0].id;

  const accountCurrency = accounts.elements.find((a) => a.id === accountId)?.currency || "EUR";
  console.log(`  Using account: ${accountId} (${accountCurrency})`);

  // Helper: strip URN prefix to get numeric ID
  const stripUrn = (urn: string) => urn.replace(/^urn:li:sponsored(Campaign|CampaignGroup):/, "");

  // 2. Fetch Campaign Groups
  console.log("2. Fetching campaign groups...");
  const rawGroups = await client.getCampaignGroups(accountId);
  const campaignGroups: CampaignGroup[] = rawGroups.map((g) => ({
    id: String(g.id),
    name: g.name,
    status: g.status,
    region: detectRegion(g.name),
  }));
  console.log(`  Found ${campaignGroups.length} campaign groups`);
  campaignGroups.forEach((g) => console.log(`    - ${g.name} → ${g.region}`));
  writeJSON("campaign-groups.json", campaignGroups);

  // Build group-to-region map and group-to-name map (supports both URN and numeric keys)
  const groupRegionMap = new Map<string, Region>();
  const groupNameMap = new Map<string, string>();
  for (const g of campaignGroups) {
    groupRegionMap.set(g.id, g.region);
    groupRegionMap.set(`urn:li:sponsoredCampaignGroup:${g.id}`, g.region);
    groupNameMap.set(g.id, g.name);
    groupNameMap.set(`urn:li:sponsoredCampaignGroup:${g.id}`, g.name);
  }

  // 3. Fetch Campaigns
  console.log("3. Fetching campaigns...");
  const rawCampaigns = await client.getCampaigns(accountId);
  const campaigns: Campaign[] = rawCampaigns.map((c) => {
    const groupUrn = c.campaignGroup || "";
    const groupId = stripUrn(groupUrn);
    return {
      id: String(c.id),
      name: c.name,
      campaignGroupName: groupNameMap.get(groupUrn) || groupNameMap.get(groupId) || undefined,
      status: c.status,
      campaignGroupId: groupId,
      region: groupRegionMap.get(groupUrn) || groupRegionMap.get(groupId) || "Global",
      dailyBudget: c.dailyBudget ? parseFloat(c.dailyBudget.amount) / 100 : undefined,
      totalBudget: c.totalBudget ? parseFloat(c.totalBudget.amount) / 100 : undefined,
      costType: c.costType,
      currency: accountCurrency,
    };
  });
  console.log(`  Found ${campaigns.length} campaigns`);
  writeJSON("campaigns.json", campaigns);

  // 4. Fetch Analytics
  console.log("4. Fetching analytics...");
  // API needs URN format for queries
  const campaignUrns = campaigns.map((c) => `urn:li:sponsoredCampaign:${c.id}`);

  // Batch in groups of 20
  const analyticsResults: CampaignAnalytics[] = [];
  for (let i = 0; i < campaignUrns.length; i += 20) {
    const batch = campaignUrns.slice(i, i + 20);
    try {
      const result = await client.getAnalytics(batch);
      // Debug: show first element structure to understand pivot field name
      if (result.elements.length > 0) {
        const keys = Object.keys(result.elements[0]);
        console.log(`  Analytics keys: ${keys.join(", ")}`);
      }
      for (let idx = 0; idx < result.elements.length; idx++) {
        const el = result.elements[idx] as any;
        // Try multiple pivot field names across API versions
        const rawPivot = el.pivotValues?.[0] || el.pivotValue || el.pivot || "";
        const campaignId = stripUrn(String(rawPivot)) || (batch[idx] ? stripUrn(batch[idx]) : "");
        analyticsResults.push({
          campaignId,
          impressions: el.impressions || 0,
          clicks: el.clicks || 0,
          costInLocalCurrency: parseFloat(String(el.costInLocalCurrency)) || 0,
          externalWebsiteConversions: el.externalWebsiteConversions || 0,
          landingPageClicks: el.landingPageClicks || 0,
          dateRange: el.dateRange,
        });
      }
    } catch (err) {
      console.warn(`  ⚠ Analytics batch failed: ${err}`);
    }
  }
  console.log(`  Got analytics for ${analyticsResults.length} campaigns`);
  writeJSON("analytics.json", analyticsResults);

  // 5. Fetch Daily Analytics
  console.log("5. Fetching daily analytics (last 30 days)...");
  const dailyResults: DailyAnalytics[] = [];
  try {
    const allUrns = campaignUrns.slice(0, 20); // First batch for daily
    const dailyData = await client.getDailyAnalytics(allUrns, 30);
    const dailyMap = new Map<string, DailyAnalytics>();

    if (dailyData.elements.length > 0) {
      console.log(`  Daily analytics keys: ${Object.keys(dailyData.elements[0]).join(", ")}`);
    }
    for (const el of dailyData.elements) {
      if (!el.dateRange?.start) continue; // Skip if no date info
      const d = el.dateRange.start;
      const dateKey = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
      const pivotCampaignId = stripUrn(String((el as any).pivotValues?.[0] || (el as any).pivotValue || ""));
      const mapKey = `${dateKey}_${pivotCampaignId}`;
      const existing = dailyMap.get(mapKey) || { date: dateKey, campaignId: pivotCampaignId, impressions: 0, clicks: 0, costInLocalCurrency: 0 };
      existing.impressions += el.impressions || 0;
      existing.clicks += el.clicks || 0;
      existing.costInLocalCurrency += parseFloat(String(el.costInLocalCurrency)) || 0;
      dailyMap.set(mapKey, existing);
    }

    dailyResults.push(...Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (err) {
    console.warn(`  ⚠ Daily analytics failed: ${err}`);
  }
  console.log(`  Got ${dailyResults.length} daily data points`);
  writeJSON("daily-analytics.json", dailyResults);

  // 6. Fetch Creatives
  console.log("6. Fetching creatives...");
  const creatives: Creative[] = [];

  try {
    console.log(`  Fetching creatives for account ${accountId}...`);
    const rawCreatives = await client.getCreatives(accountId);
    console.log(`  Found ${rawCreatives.length} creatives`);

    for (const rc of rawCreatives) {
      let adText = "";
      let headline = "";
      let landingPageUrl = "";
      let mediaPath = "";
      let mediaType: Creative["mediaType"] = "unknown";

      // Detect media type from creative type field
      if (rc.type?.includes("DOCUMENT")) mediaType = "document";
      else if (rc.type?.includes("VIDEO")) mediaType = "video";

      // Extract landing page URL from call-to-action (skip URNs like urn:li:adForm:...)
      if (rc.callToAction?.target && !rc.callToAction.target.startsWith("urn:")) {
        landingPageUrl = rc.callToAction.target;
      }

      // Resolve post reference for ad text, headline, and media
      if (rc.reference) {
        try {
          const post = await client.getPost(rc.reference);

          // Commentary = intro text (Texte pub présentation)
          if (post.commentary) {
            adText = post.commentary;
          }

          // Extract headline from post content (check all possible locations)
          if (post.content?.article?.title) {
            headline = post.content.article.title;
          }
          if (post.content?.document?.title) {
            headline = post.content.document.title;
            if (mediaType === "unknown") mediaType = "document";
          }
          // media.title is used for native documents (Lead Gen forms)
          if (post.content?.media?.title) {
            headline = post.content.media.title;
          }

          // Detect media type and download images
          if (post.content?.media?.id) {
            // Documents have URNs like urn:li:document:..., images like urn:li:image:...
            if (post.content.media.id.includes(":document:")) {
              if (mediaType === "unknown") mediaType = "document";
            } else {
              if (mediaType === "unknown") mediaType = "image";
            }
            try {
              const images = await client.getImages([post.content.media.id]);
              const imageData = Object.values(images.results)[0];
              if (imageData?.downloadUrl) {
                const hash = post.content.media.id.replace(/[^a-zA-Z0-9]/g, "_");
                mediaPath = await downloadImage(imageData.downloadUrl, `${hash}.jpg`);
              }
            } catch {
              console.warn(`    ⚠ Could not download image for creative ${rc.id}`);
            }
          } else if (post.content?.multiImage) {
            mediaType = "carousel";
          }

          // Landing page from post (skip URNs)
          if (!landingPageUrl && post.content?.article?.source && !post.content.article.source.startsWith("urn:")) {
            landingPageUrl = post.content.article.source;
          }
        } catch {
          console.warn(`    ⚠ Could not fetch post for creative ${rc.id}`);
        }
      }

      // Map campaign URN to numeric ID
      const campaignId = (rc.campaign || "").replace("urn:li:sponsoredCampaign:", "");

      creatives.push({
        id: `creative_${rc.id}`,
        campaignId,
        name: `Creative ${rc.id}`,
        status: rc.status === "ACTIVE" ? "ACTIVE" : rc.status,
        adText,
        headline,
        mediaType,
        localMediaPath: mediaPath || null,
        landingPageUrl,
      });

      console.log(`    ✓ ${rc.id}: ${mediaType}`);
      console.log(`      headline: ${headline.substring(0, 60) || "(none)"}`);
      console.log(`      adText: ${adText.substring(0, 60) || "(none)"}`);
    }
  } catch (err) {
    console.warn(`  ⚠ Creative fetch failed: ${err}`);
  }
  console.log(`  → ${creatives.length} creatives processed`);
  writeJSON("creatives.json", creatives);

  // 7. Write timestamp
  writeJSON("last-updated.json", { timestamp: new Date().toISOString() });

  console.log("\n✓ Data fetch complete!\n");
}

main().catch((err) => {
  console.error("\n✗ Fatal error:", err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
