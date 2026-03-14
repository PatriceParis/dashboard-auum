"use client";

import type { DashboardData, Region } from "@/lib/types";
import { computeKPIs } from "@/lib/kpi-calculator";
import { KPIGrid } from "./kpi-grid";
import { CampaignTable } from "./campaign-table";
import { PerformanceChart } from "./performance-chart";
import { CreativeGallery } from "./creative-gallery";

interface Props {
  data: DashboardData;
  region: Region;
}

export function RegionTab({ data, region }: Props) {
  const kpis = computeKPIs(data.campaigns, data.analytics, region);

  const filteredCampaigns =
    region === "Global"
      ? data.campaigns
      : data.campaigns.filter((c) => c.region === region);

  const campaignIds = new Set(filteredCampaigns.map((c) => c.id));

  const filteredCreatives = data.creatives.filter((cr) =>
    campaignIds.has(cr.campaignId)
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPIGrid kpis={kpis} />

      {/* Performance Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Performance</h2>
        <PerformanceChart data={data.dailyAnalytics} campaignIds={campaignIds} />
      </div>

      {/* Campaign Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Campagnes ({filteredCampaigns.length})
        </h2>
        <CampaignTable
          campaigns={filteredCampaigns}
          analytics={data.analytics}
        />
      </div>

      {/* Creatives */}
      {filteredCreatives.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Creatives ({filteredCreatives.length})
          </h2>
          <CreativeGallery
            creatives={filteredCreatives}
            campaigns={filteredCampaigns}
          />
        </div>
      )}
    </div>
  );
}
