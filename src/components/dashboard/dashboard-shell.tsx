"use client";

import { useState, useMemo } from "react";
import type { DashboardData } from "@/lib/types";
import { RegionTab } from "./region-tab";
import { OutboundSection } from "./outbound-section";
import { ABXSection } from "./abx-section";
import { DateSelector } from "./date-selector";
import { Clock, BarChart3, Megaphone, Send, Crosshair } from "lucide-react";

interface Props {
  data: DashboardData;
}

type Tab = "paid" | "outbound" | "abx";

export function DashboardShell({ data }: Props) {

  const [activeTab, setActiveTab] = useState<Tab>("paid");

  // Date range state — default to last 60 days
  const dataEnd = data.dataPeriod?.end ??
    (data.dailyAnalytics.length > 0
      ? data.dailyAnalytics.reduce((max, d) => d.date > max ? d.date : max, data.dailyAnalytics[0].date)
      : new Date().toISOString().slice(0, 10));

  const sixtyDaysAgo = new Date(dataEnd);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const defaultStart = sixtyDaysAgo.toISOString().slice(0, 10);
  const defaultEnd = dataEnd;

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
      existing.externalWebsiteConversions += d.leads || 0;
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

  // Filter lemlist daily activities by date range
  const filteredLemlistDaily = useMemo(() => {
    if (!data.lemlist) return [];
    return data.lemlist.dailyActivities.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );
  }, [data.lemlist, startDate, endDate]);

  const lastUpdated = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

  const hasLemlist = data.lemlist && data.lemlist.campaigns.length > 0;
  const hasABX = !!data.abx;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ABX Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Auum &lt;&gt; Bulldozer Collective</p>
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

      {/* Tab navigation */}
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("paid")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "paid"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          LinkedIn Ads Dashboard
        </button>
        {hasLemlist && (
          <button
            onClick={() => setActiveTab("outbound")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === "outbound"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <Send className="w-4 h-4" />
            Outbound Dashboard
          </button>
        )}
        {hasABX && (
          <button
            onClick={() => setActiveTab("abx")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === "abx"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <Crosshair className="w-4 h-4" />
            ABX Dashboard
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "paid" && (
        <RegionTab data={filteredData} region="Global" />
      )}

      {activeTab === "outbound" && hasLemlist && (
        <OutboundSection
          data={data.lemlist!}
          filteredDailyActivities={filteredLemlistDaily}
        />
      )}

      {activeTab === "abx" && hasABX && (
        <ABXSection data={data.abx!} />
      )}
    </div>
  );
}
