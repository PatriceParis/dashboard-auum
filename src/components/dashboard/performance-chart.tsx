"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyAnalytics } from "@/lib/types";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface Props {
  data: DailyAnalytics[];
  campaignIds?: Set<string>;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name === "impressions"
            ? `Impressions: ${formatNumber(entry.value)}`
            : entry.name === "clicks"
            ? `Clics: ${formatNumber(entry.value)}`
            : `Coût: ${formatCurrency(entry.value)}`}
        </p>
      ))}
    </div>
  );
}

export function PerformanceChart({ data, campaignIds }: Props) {
  const chartData = useMemo(() => {
    const filtered = campaignIds
      ? data.filter((d) => campaignIds.has(d.campaignId))
      : data;

    // Aggregate by date across all campaigns
    const byDate = new Map<string, { impressions: number; clicks: number; cost: number }>();
    for (const d of filtered) {
      const existing = byDate.get(d.date) || { impressions: 0, clicks: 0, cost: 0 };
      existing.impressions += d.impressions;
      existing.clicks += d.clicks;
      existing.cost += d.costInLocalCurrency;
      byDate.set(d.date, existing);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: new Date(date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        impressions: vals.impressions,
        clicks: vals.clicks,
        cost: vals.cost,
      }));
  }, [data, campaignIds]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune donnée de performance disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value: string) =>
            value === "impressions" ? "Impressions" : "Clics"
          }
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="impressions"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#gradImpressions)"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="clicks"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#gradClicks)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
