"use client";

import { useState, useMemo } from "react";
import type { ABXCompany } from "@/lib/types";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

interface Props {
  companies: ABXCompany[];
}

type SortKey =
  | "name"
  | "paidImpressions"
  | "paidClicks"
  | "outboundLeads"
  | "prospects"
  | "devisCount"
  | "revenue"
  | "pipeline";

type Filter = "all" | "influenced" | "paid" | "outbound" | "withDevis";

const ENGAGEMENT_COLORS: Record<string, string> = {
  "Très élevée": "bg-emerald-100 text-emerald-800",
  "Élevée": "bg-green-100 text-green-800",
  "Moyennes": "bg-yellow-100 text-yellow-800",
  "Négatif": "bg-red-100 text-red-800",
  "Very Low": "bg-gray-100 text-gray-700",
};

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function formatCurrency(n: number): string {
  if (n === 0) return "—";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}

export function ABXCompanyTable({ companies }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<Filter>("influenced");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = companies;

    // Apply filter
    switch (filter) {
      case "influenced":
        result = result.filter(
          (c) => (c.influencedByPaid || c.influencedByOutbound) && c.inCRM
        );
        break;
      case "paid":
        result = result.filter((c) => c.influencedByPaid && c.inCRM);
        break;
      case "outbound":
        result = result.filter((c) => c.influencedByOutbound && c.inCRM);
        break;
      case "withDevis":
        result = result.filter(
          (c) => c.devisCount > 0 && (c.influencedByPaid || c.influencedByOutbound)
        );
        break;
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
      );
    }

    return result;
  }, [companies, filter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortKey === "name") {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else {
        va = a[sortKey] as number;
        vb = b[sortKey] as number;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (
      sortAsc ? (
        <ArrowUp className="w-3.5 h-3.5 inline ml-1" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 inline ml-1" />
      )
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 inline ml-1 opacity-30" />
    );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "influenced", label: "Influencées" },
    { key: "paid", label: "Paid only" },
    { key: "outbound", label: "Outbound only" },
    { key: "withDevis", label: "Avec devis" },
    { key: "all", label: "Toutes" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">
          Entreprises ({sorted.length})
        </h3>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une entreprise..."
        className="w-full sm:w-72 px-3 py-2 text-sm border border-border rounded-lg bg-background mb-4"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th
                className="text-left py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("name")}
              >
                Entreprise {sortIcon("name")}
              </th>
              <th className="text-center py-3 px-2">Engagement</th>
              <th className="text-center py-3 px-2">Source</th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("paidImpressions")}
              >
                Impr. {sortIcon("paidImpressions")}
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("paidClicks")}
              >
                Clics {sortIcon("paidClicks")}
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("outboundLeads")}
              >
                Outbound {sortIcon("outboundLeads")}
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("prospects")}
              >
                Prospects {sortIcon("prospects")}
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("devisCount")}
              >
                Devis {sortIcon("devisCount")}
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("pipeline")}
              >
                Pipeline {sortIcon("pipeline")}
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer select-none"
                onClick={() => toggleSort("revenue")}
              >
                Revenue {sortIcon("revenue")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 100).map((c, i) => (
              <tr
                key={c.domain || c.name + i}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="font-medium text-foreground">{c.name}</div>
                  {c.domain && (
                    <div className="text-xs text-muted-foreground">{c.domain}</div>
                  )}
                </td>
                <td className="py-3 px-2 text-center">
                  {c.paidEngagement && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ENGAGEMENT_COLORS[c.paidEngagement] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.paidEngagement}
                    </span>
                  )}
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex justify-center gap-1">
                    {c.influencedByPaid && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                        Paid
                      </span>
                    )}
                    {c.influencedByOutbound && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                        Outbound
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {c.paidImpressions > 0 ? formatNumber(c.paidImpressions) : "—"}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {c.paidClicks > 0 ? formatNumber(c.paidClicks) : "—"}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {c.outboundLeads > 0 ? formatNumber(c.outboundLeads) : "—"}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {c.prospects > 0 ? formatNumber(c.prospects) : "—"}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {c.devisCount > 0 ? formatNumber(c.devisCount) : "—"}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {formatCurrency(c.pipeline)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-medium">
                  {formatCurrency(c.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 100 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Affichage limité aux 100 premières entreprises
          </p>
        )}
      </div>
    </div>
  );
}
