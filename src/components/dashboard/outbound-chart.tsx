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
import type { LemlistDailyActivity } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface Props {
  data: LemlistDailyActivity[];
}

const LABELS: Record<string, string> = {
  sent: "Emails envoyés",
  opened: "Emails ouverts",
  replied: "Réponses email",
  liInvites: "Invitations LI",
  liReplied: "Réponses LI",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {LABELS[entry.name] || entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function OutboundChart({ data }: Props) {
  const chartData = useMemo(() => {
    // Aggregate by date across all campaigns
    const byDate = new Map<string, { sent: number; opened: number; replied: number; liInvites: number; liReplied: number }>();
    for (const d of data) {
      const existing = byDate.get(d.date) || { sent: 0, opened: 0, replied: 0, liInvites: 0, liReplied: 0 };
      existing.sent += d.sent;
      existing.opened += d.opened;
      existing.replied += d.replied;
      existing.liInvites += d.liInvites;
      existing.liReplied += d.liReplied;
      byDate.set(d.date, existing);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: new Date(date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        ...vals,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune donnée outbound disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradReplied" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLiInvites" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0a66c2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLiReplied" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e65100" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#e65100" stopOpacity={0} />
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
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value: string) => LABELS[value] || value}
        />
        <Area
          type="monotone"
          dataKey="sent"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#gradSent)"
        />
        <Area
          type="monotone"
          dataKey="opened"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#gradOpened)"
        />
        <Area
          type="monotone"
          dataKey="replied"
          stroke="#9333ea"
          strokeWidth={2}
          fill="url(#gradReplied)"
        />
        <Area
          type="monotone"
          dataKey="liInvites"
          stroke="#0a66c2"
          strokeWidth={2}
          fill="url(#gradLiInvites)"
          strokeDasharray="5 3"
        />
        <Area
          type="monotone"
          dataKey="liReplied"
          stroke="#e65100"
          strokeWidth={2}
          fill="url(#gradLiReplied)"
          strokeDasharray="5 3"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
