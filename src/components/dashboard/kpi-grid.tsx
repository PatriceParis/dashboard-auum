import type { ComputedKPIs } from "@/lib/types";
import { KPI_CONFIG } from "@/lib/constants";
import { KPICard } from "./kpi-card";
import {
  Wallet,
  Eye,
  BarChart2,
  MousePointerClick,
  Target,
  UserCheck,
  TrendingUp,
} from "lucide-react";

const KPI_ICONS: Record<string, React.ReactNode> = {
  budget: <Wallet className="w-5 h-5" />,
  impressions: <Eye className="w-5 h-5" />,
  cpm: <BarChart2 className="w-5 h-5" />,
  ctr: <TrendingUp className="w-5 h-5" />,
  clicks: <MousePointerClick className="w-5 h-5" />,
  cpl: <Target className="w-5 h-5" />,
  leads: <UserCheck className="w-5 h-5" />,
};

interface Props {
  kpis: ComputedKPIs;
}

export function KPIGrid({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {KPI_CONFIG.map(({ key, label, format }) => (
        <KPICard
          key={key}
          label={label}
          value={kpis[key as keyof ComputedKPIs]}
          format={format}
          icon={KPI_ICONS[key]}
        />
      ))}
    </div>
  );
}
