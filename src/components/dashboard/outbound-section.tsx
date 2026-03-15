"use client";

import { useMemo } from "react";
import type { LemlistData, LemlistDailyActivity } from "@/lib/types";
import { computeOutboundKPIs } from "@/lib/outbound-kpi-calculator";
import { OutboundKPIGrid } from "./outbound-kpi-grid";
import { OutboundChart } from "./outbound-chart";
import { OutboundCampaignTable } from "./outbound-campaign-table";

interface Props {
  data: LemlistData;
  filteredDailyActivities: LemlistDailyActivity[];
}

export function OutboundSection({ data, filteredDailyActivities }: Props) {
  // Recompute campaign stats from filtered daily activities
  const filteredStats = useMemo(() => {
    if (filteredDailyActivities === data.dailyActivities) {
      // No date filtering applied, use original stats
      return data.campaignStats;
    }
    // Aggregate filtered daily activities per campaign
    const statsMap = new Map<string, {
      sent: number; opened: number; clicked: number; replied: number; bounced: number;
      liInvites: number; liAccepted: number; liSent: number; liReplied: number;
    }>();
    for (const d of filteredDailyActivities) {
      const existing = statsMap.get(d.campaignId) || {
        sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0,
        liInvites: 0, liAccepted: 0, liSent: 0, liReplied: 0,
      };
      existing.sent += d.sent;
      existing.opened += d.opened;
      existing.clicked += d.clicked;
      existing.replied += d.replied;
      existing.bounced += d.bounced;
      existing.liInvites += d.liInvites;
      existing.liAccepted += d.liAccepted;
      existing.liSent += d.liSent;
      existing.liReplied += d.liReplied;
      statsMap.set(d.campaignId, existing);
    }
    return data.campaignStats.map((cs) => {
      const filtered = statsMap.get(cs.campaignId);
      if (!filtered) return { ...cs, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, liInvites: 0, liAccepted: 0, liSent: 0, liReplied: 0 };
      return { ...cs, ...filtered };
    });
  }, [data, filteredDailyActivities]);

  const kpis = computeOutboundKPIs(filteredStats);

  return (
    <div className="space-y-6">
      <OutboundKPIGrid kpis={kpis} />

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Activité Outbound</h2>
        <OutboundChart data={filteredDailyActivities} />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Campagnes ({data.campaigns.length})
        </h2>
        <OutboundCampaignTable
          campaigns={data.campaigns}
          stats={filteredStats}
        />
      </div>
    </div>
  );
}
