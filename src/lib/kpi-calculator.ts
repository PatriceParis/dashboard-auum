import type { Campaign, CampaignAnalytics, ComputedKPIs, Region } from "./types";

export function computeKPIs(
  campaigns: Campaign[],
  analytics: CampaignAnalytics[],
  region: Region
): ComputedKPIs {
  const filteredCampaigns =
    region === "Global"
      ? campaigns
      : campaigns.filter((c) => c.region === region);

  const campaignIds = new Set(filteredCampaigns.map((c) => c.id));

  const filteredAnalytics = analytics.filter((a) =>
    campaignIds.has(a.campaignId)
  );

  const totalImpressions = filteredAnalytics.reduce(
    (sum, a) => sum + a.impressions,
    0
  );
  const totalClicks = filteredAnalytics.reduce(
    (sum, a) => sum + a.clicks,
    0
  );
  const totalCost = filteredAnalytics.reduce(
    (sum, a) => sum + a.costInLocalCurrency,
    0
  );
  const totalLeads = filteredAnalytics.reduce(
    (sum, a) => sum + a.externalWebsiteConversions,
    0
  );

  return {
    budget: totalCost,
    impressions: totalImpressions,
    cpm: totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    clicks: totalClicks,
    cpl: totalLeads > 0 ? totalCost / totalLeads : Infinity,
    leads: totalLeads,
  };
}
