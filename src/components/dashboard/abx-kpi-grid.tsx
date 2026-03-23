import type { ABXSummary } from "@/lib/types";
import { KPICard } from "./kpi-card";
import {
  Wallet,
  Building2,
  TrendingUp,
  Trophy,
  Zap,
  Target,
} from "lucide-react";
import { formatKPI } from "@/lib/utils";

interface Props {
  summary: ABXSummary;
}

export function ABXKPIGrid({ summary }: Props) {
  const pipelineEfficiency = summary.totalAdSpend > 0
    ? (summary.influencedPipeline / summary.totalAdSpend)
    : 0;
  const roas = summary.totalAdSpend > 0
    ? (summary.influencedRevenue / summary.totalAdSpend)
    : 0;

  return (
    <div className="space-y-4">
      {/* Primary KPIs — Fibbler style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ad Spend */}
        <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 opacity-80" />
            <span className="text-sm font-medium opacity-80">Ad Spend</span>
          </div>
          <div className="text-3xl font-bold">{formatKPI(summary.totalAdSpend, "currency")}</div>
        </div>

        {/* Influenced Pipeline */}
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 opacity-80" />
              <span className="text-sm font-medium opacity-80">Influenced Pipeline</span>
            </div>
            <div className="text-right">
              <span className="text-xs opacity-70">Pipeline efficiency</span>
              <div className="text-sm font-bold">{pipelineEfficiency.toFixed(2)}x</div>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm opacity-80">Devis: {summary.influencedWithDevis}</span>
          </div>
          <div className="text-3xl font-bold">{formatKPI(summary.influencedPipeline, "currency")}</div>
          <div className="flex gap-2 mt-2">
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">Paid: {summary.influencedWithDevis}</span>
          </div>
        </div>

        {/* Influenced Revenue */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 opacity-80" />
              <span className="text-sm font-medium opacity-80">Influenced Revenue</span>
            </div>
            <div className="text-right">
              <span className="text-xs opacity-70">ROAS</span>
              <div className="text-sm font-bold">{roas.toFixed(2)}x</div>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm opacity-80">Won deals: {summary.influencedWithWon}</span>
          </div>
          <div className="text-3xl font-bold">{formatKPI(summary.influencedRevenue, "currency")}</div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Sociétés touchées (Paid)"
          value={summary.companiesReachedByPaid}
          format="number"
          icon={<Target className="w-5 h-5" />}
          accentColor="border-t-blue-400"
        />
        <KPICard
          label="Sociétés touchées (Outbound)"
          value={summary.companiesReachedByOutbound}
          format="number"
          icon={<Zap className="w-5 h-5" />}
          accentColor="border-t-purple-400"
        />
        <KPICard
          label="Influencées dans CRM"
          value={summary.influencedCount}
          format="number"
          icon={<Building2 className="w-5 h-5" />}
          accentColor="border-t-emerald-400"
        />
        <KPICard
          label="Avec devis"
          value={summary.influencedWithDevis}
          format="number"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="border-t-amber-400"
        />
      </div>
    </div>
  );
}
