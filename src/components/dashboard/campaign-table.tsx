"use client";

import { useState, useMemo } from "react";
import type { Campaign, CampaignAnalytics } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

interface Props {
  campaigns: Campaign[];
  analytics: CampaignAnalytics[];
}

type SortKey = "name" | "impressions" | "clicks" | "ctr" | "cost" | "cpm" | "leads" | "cpl";

interface CampaignRow {
  campaign: Campaign;
  impressions: number;
  clicks: number;
  cost: number;
  leads: number;
  ctr: number;
  cpm: number;
  cpl: number;
}

export function CampaignTable({ campaigns, analytics }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortAsc, setSortAsc] = useState(false);

  const analyticsMap = useMemo(() => {
    const map = new Map<string, CampaignAnalytics>();
    for (const a of analytics) map.set(a.campaignId, a);
    return map;
  }, [analytics]);

  const rows: CampaignRow[] = useMemo(() => {
    return campaigns.map((c) => {
      const a = analyticsMap.get(c.id);
      const impressions = a?.impressions || 0;
      const clicks = a?.clicks || 0;
      const cost = a?.costInLocalCurrency || 0;
      const leads = a?.externalWebsiteConversions || 0;
      return {
        campaign: c,
        impressions,
        clicks,
        cost,
        leads,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
        cpl: leads > 0 ? cost / leads : Infinity,
      };
    });
  }, [campaigns, analyticsMap]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortKey === "name") {
        va = a.campaign.name.toLowerCase();
        vb = b.campaign.name.toLowerCase();
      } else {
        va = a[sortKey];
        vb = b[sortKey];
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? (
        <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
      )
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 inline ml-1 opacity-30" />
    );

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-gray-100 text-gray-600",
    ARCHIVED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th
              className="py-3 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={() => handleSort("name")}
            >
              Campagne <SortIcon col="name" />
            </th>
            <th className="py-3 px-3 font-medium text-muted-foreground">
              Statut
            </th>
            {(["impressions", "clicks", "ctr", "cost", "cpm", "leads", "cpl"] as SortKey[]).map(
              (col) => (
                <th
                  key={col}
                  className="py-3 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort(col)}
                >
                  {col === "impressions"
                    ? "Impr."
                    : col === "clicks"
                    ? "Clics"
                    : col === "ctr"
                    ? "CTR"
                    : col === "cost"
                    ? "Cout"
                    : col === "cpm"
                    ? "CPM"
                    : col === "leads"
                    ? "Leads"
                    : "CPL"}
                  <SortIcon col={col} />
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.campaign.id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-3 font-medium">
                {row.campaign.name}
              </td>
              <td className="py-3 px-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    statusColors[row.campaign.status] || "bg-gray-100"
                  }`}
                >
                  {row.campaign.status}
                </span>
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatNumber(row.impressions)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatNumber(row.clicks)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatPercent(row.ctr)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatCurrency(row.cost)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatCurrency(row.cpm)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatNumber(row.leads)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {formatCurrency(row.cpl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucune campagne pour cette region
        </div>
      )}
    </div>
  );
}
