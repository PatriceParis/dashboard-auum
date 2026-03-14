"use client";

import { useState, useMemo } from "react";
import type { DashboardData, Region } from "@/lib/types";
import { REGIONS, REGION_LABELS } from "@/lib/constants";
import { RegionTab } from "./region-tab";
import { DateSelector } from "./date-selector";
import { Clock, BarChart3 } from "lucide-react";

interface Props {
  data: DashboardData;
}

export function DashboardShell({ data }: Props) {
  const [activeRegion, setActiveRegion] = useState<Region>("Global");

  // Date range state
  const defaultStart = data.dataPeriod?.start ??
    (data.dailyAnalytics.length > 0
      ? data.dailyAnalytics.reduce((min, d) => d.date < min ? d.date : min, data.dailyAnalytics[0].date)
      : "2026-03-06");
  const defaultEnd = data.dataPeriod?.end ??
    (data.dailyAnalytics.length > 0
      ? data.dailyAnalytics.reduce((max, d) => d.date > max ? d.date : max, data.dailyAnalytics[0].date)
      : "2026-03-12");

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Filter daily analytics by date range and recompute aggregated analytics
  const filteredData = useMemo(() => {
    // If no daily analytics available, use the pre-aggregated analytics as-is
    if (data.dailyAnalytics.length === 0) {
      return data;
    }

    const filteredDaily = data.dailyAnalytics.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );

    const analyticsMap = new Map<string, {
      impressions: number;
      clicks: number;
      costInLocalCurrency: number;
      externalWebsiteConversions: number;
      landingPageClicks: number;
    }>();

    for (const d of filteredDaily) {
      const existing = analyticsMap.get(d.campaignId) || {
        impressions: 0, clicks: 0, costInLocalCurrency: 0,
        externalWebsiteConversions: 0, landingPageClicks: 0,
      };
      existing.impressions += d.impressions;
      existing.clicks += d.clicks;
      existing.costInLocalCurrency += d.costInLocalCurrency;
      analyticsMap.set(d.campaignId, existing);
    }

    const filteredAnalytics = Array.from(analyticsMap.entries()).map(([campaignId, vals]) => ({
      campaignId, ...vals,
    }));

    return {
      ...data,
      analytics: filteredAnalytics,
      dailyAnalytics: filteredDaily,
    };
  }, [data, startDate, endDate]);

  const lastUpdated = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              LinkedIn Ads Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Auum</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <DateSelector
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
            <Clock className="w-4 h-4" />
            <span>MAJ : {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-fit">
        {REGIONS.map((region) => {
          const count =
            region === "Global"
              ? data.campaigns.length
              : data.campaigns.filter((c) => c.region === region).length;

          return (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeRegion === region
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {REGION_LABELS[region]}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeRegion === region
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/10"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <RegionTab data={filteredData} region={activeRegion} />
    </div>
  );
}
