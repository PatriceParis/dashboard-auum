"use client";

import { useState, useMemo } from "react";
import type { LemlistCampaign, LemlistCampaignStats } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

interface Props {
  campaigns: LemlistCampaign[];
  stats: LemlistCampaignStats[];
}

type SortKey = "name" | "sent" | "opened" | "openRate" | "clicked" | "replied" | "replyRate" | "bounced" | "liInvites" | "liAccepted" | "liAcceptRate" | "liReplied";

interface Row {
  campaign: LemlistCampaign;
  stats: LemlistCampaignStats;
  openRate: number;
  replyRate: number;
  liAcceptRate: number;
}

export function OutboundCampaignTable({ campaigns, stats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("sent");
  const [sortAsc, setSortAsc] = useState(false);

  const statsMap = useMemo(() => {
    const map = new Map<string, LemlistCampaignStats>();
    for (const s of stats) map.set(s.campaignId, s);
    return map;
  }, [stats]);

  const rows: Row[] = useMemo(() => {
    return campaigns.map((c) => {
      const s = statsMap.get(c.id) || {
        campaignId: c.id, campaignName: c.name,
        sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, interested: 0,
        liInvites: 0, liAccepted: 0, liSent: 0, liReplied: 0,
      };
      return {
        campaign: c,
        stats: s,
        openRate: s.sent > 0 ? (s.opened / s.sent) * 100 : 0,
        replyRate: s.sent > 0 ? (s.replied / s.sent) * 100 : 0,
        liAcceptRate: s.liInvites > 0 ? (s.liAccepted / s.liInvites) * 100 : 0,
      };
    });
  }, [campaigns, statsMap]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortKey === "name") {
        va = a.campaign.name.toLowerCase();
        vb = b.campaign.name.toLowerCase();
      } else if (sortKey === "openRate") {
        va = a.openRate;
        vb = b.openRate;
      } else if (sortKey === "replyRate") {
        va = a.replyRate;
        vb = b.replyRate;
      } else if (sortKey === "liAcceptRate") {
        va = a.liAcceptRate;
        vb = b.liAcceptRate;
      } else {
        va = a.stats[sortKey as keyof LemlistCampaignStats] as number;
        vb = b.stats[sortKey as keyof LemlistCampaignStats] as number;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 inline ml-1 opacity-30" />
    );

  const columns: { key: SortKey; label: string; group?: string }[] = [
    { key: "sent", label: "Envoyés", group: "email" },
    { key: "opened", label: "Ouverts", group: "email" },
    { key: "openRate", label: "Taux ouv.", group: "email" },
    { key: "clicked", label: "Clics", group: "email" },
    { key: "replied", label: "Réponses", group: "email" },
    { key: "replyRate", label: "Taux rép.", group: "email" },
    { key: "bounced", label: "Rebonds", group: "email" },
    { key: "liInvites", label: "Invit. LI", group: "linkedin" },
    { key: "liAccepted", label: "Acceptées", group: "linkedin" },
    { key: "liAcceptRate", label: "Taux acc.", group: "linkedin" },
    { key: "liReplied", label: "Rép. LI", group: "linkedin" },
  ];

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
            <th className="py-3 px-3 font-medium text-muted-foreground">Labels</th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-3 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort(col.key)}
              >
                {col.label} <SortIcon col={col.key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.campaign.id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-3 font-medium max-w-[250px] truncate">
                {row.campaign.name}
              </td>
              <td className="py-3 px-3">
                <div className="flex gap-1 flex-wrap">
                  {row.campaign.labels.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.sent)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.opened)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatPercent(row.openRate)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.clicked)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.replied)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatPercent(row.replyRate)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.bounced)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.liInvites)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.liAccepted)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatPercent(row.liAcceptRate)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatNumber(row.stats.liReplied)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucune campagne outbound active
        </div>
      )}
    </div>
  );
}
