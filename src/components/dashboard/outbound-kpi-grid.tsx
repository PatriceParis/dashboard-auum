import type { OutboundKPIs } from "@/lib/types";
import { OUTBOUND_KPI_CONFIG } from "@/lib/constants";
import { KPICard } from "./kpi-card";
import {
  Send,
  MailOpen,
  MousePointerClick,
  Reply,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react";

const OUTBOUND_ICONS: Record<string, React.ReactNode> = {
  emailsSent: <Send className="w-5 h-5" />,
  openRate: <MailOpen className="w-5 h-5" />,
  clickRate: <MousePointerClick className="w-5 h-5" />,
  replyRate: <Reply className="w-5 h-5" />,
  bounceRate: <AlertTriangle className="w-5 h-5" />,
  interested: <ThumbsUp className="w-5 h-5" />,
};

interface Props {
  kpis: OutboundKPIs;
}

export function OutboundKPIGrid({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {OUTBOUND_KPI_CONFIG.map(({ key, label, format }) => (
        <KPICard
          key={key}
          label={label}
          value={kpis[key as keyof OutboundKPIs]}
          format={format}
          icon={OUTBOUND_ICONS[key]}
        />
      ))}
    </div>
  );
}
