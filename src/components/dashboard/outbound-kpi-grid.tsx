import type { OutboundKPIs } from "@/lib/types";
import { OUTBOUND_KPI_CONFIG } from "@/lib/constants";
import { KPICard } from "./kpi-card";
import {
  Send,
  MailOpen,
  Reply,
  Users,
  MessageSquare,
  Linkedin,
  UserCheck,
  MessageCircle,
  Target,
  Handshake,
  TrendingUp,
} from "lucide-react";

const OUTBOUND_ICONS: Record<string, React.ReactNode> = {
  totalContacted: <Users className="w-5 h-5" />,
  totalReplies: <MessageSquare className="w-5 h-5" />,
  mqlRate: <Target className="w-5 h-5" />,
  sqlRate: <TrendingUp className="w-5 h-5" />,
  dealRate: <Handshake className="w-5 h-5" />,
  emailsSent: <Send className="w-5 h-5" />,
  emailOpenRate: <MailOpen className="w-5 h-5" />,
  emailReplyRate: <Reply className="w-5 h-5" />,
  liInvites: <Linkedin className="w-5 h-5" />,
  liAcceptRate: <UserCheck className="w-5 h-5" />,
  liReplied: <MessageCircle className="w-5 h-5" />,
};

// Accent color per KPI key
const ACCENT_COLORS: Record<string, string> = {
  totalContacted: "border-t-purple-400",
  totalReplies: "border-t-purple-400",
  mqlRate: "border-t-emerald-400",
  sqlRate: "border-t-emerald-500",
  dealRate: "border-t-emerald-600",
  emailsSent: "border-t-orange-400",
  emailOpenRate: "border-t-orange-400",
  emailReplyRate: "border-t-orange-400",
  liInvites: "border-t-sky-500",
  liAcceptRate: "border-t-sky-500",
  liReplied: "border-t-sky-500",
};

interface Props {
  kpis: OutboundKPIs;
}

export function OutboundKPIGrid({ kpis }: Props) {
  return (
    <div className="space-y-4">
      {/* Cross-channel + ABX funnel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {OUTBOUND_KPI_CONFIG.slice(0, 5).map(({ key, label, format }) => (
          <KPICard
            key={key}
            label={label}
            value={kpis[key as keyof OutboundKPIs]}
            format={format}
            icon={OUTBOUND_ICONS[key]}
            accentColor={ACCENT_COLORS[key]}
          />
        ))}
      </div>
      {/* Channel-specific KPIs: Email | LinkedIn */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {OUTBOUND_KPI_CONFIG.slice(5).map(({ key, label, format }) => (
          <KPICard
            key={key}
            label={label}
            value={kpis[key as keyof OutboundKPIs]}
            format={format}
            icon={OUTBOUND_ICONS[key]}
            accentColor={ACCENT_COLORS[key]}
          />
        ))}
      </div>
    </div>
  );
}
