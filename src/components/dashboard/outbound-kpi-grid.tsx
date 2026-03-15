import type { OutboundKPIs } from "@/lib/types";
import { OUTBOUND_KPI_CONFIG } from "@/lib/constants";
import { KPICard } from "./kpi-card";
import {
  Send,
  MailOpen,
  Reply,
  ThumbsUp,
  Users,
  MessageSquare,
  Linkedin,
  UserCheck,
  MessageCircle,
} from "lucide-react";

const OUTBOUND_ICONS: Record<string, React.ReactNode> = {
  totalContacted: <Users className="w-5 h-5" />,
  totalReplies: <MessageSquare className="w-5 h-5" />,
  interested: <ThumbsUp className="w-5 h-5" />,
  emailsSent: <Send className="w-5 h-5" />,
  emailOpenRate: <MailOpen className="w-5 h-5" />,
  emailReplyRate: <Reply className="w-5 h-5" />,
  liInvites: <Linkedin className="w-5 h-5" />,
  liAcceptRate: <UserCheck className="w-5 h-5" />,
  liReplied: <MessageCircle className="w-5 h-5" />,
};

interface Props {
  kpis: OutboundKPIs;
}

export function OutboundKPIGrid({ kpis }: Props) {
  return (
    <div className="space-y-4">
      {/* Cross-channel KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {OUTBOUND_KPI_CONFIG.slice(0, 3).map(({ key, label, format }) => (
          <KPICard
            key={key}
            label={label}
            value={kpis[key as keyof OutboundKPIs]}
            format={format}
            icon={OUTBOUND_ICONS[key]}
          />
        ))}
      </div>
      {/* Channel-specific KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {OUTBOUND_KPI_CONFIG.slice(3).map(({ key, label, format }) => (
          <KPICard
            key={key}
            label={label}
            value={kpis[key as keyof OutboundKPIs]}
            format={format}
            icon={OUTBOUND_ICONS[key]}
          />
        ))}
      </div>
    </div>
  );
}
