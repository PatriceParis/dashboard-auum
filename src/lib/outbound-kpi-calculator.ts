import type { LemlistCampaignStats, OutboundKPIs } from "./types";

export function computeOutboundKPIs(stats: LemlistCampaignStats[]): OutboundKPIs {
  const totalSent = stats.reduce((sum, s) => sum + s.sent, 0);
  const totalOpened = stats.reduce((sum, s) => sum + s.opened, 0);
  const totalClicked = stats.reduce((sum, s) => sum + s.clicked, 0);
  const totalReplied = stats.reduce((sum, s) => sum + s.replied, 0);
  const totalBounced = stats.reduce((sum, s) => sum + s.bounced, 0);
  const totalInterested = stats.reduce((sum, s) => sum + s.interested, 0);

  return {
    emailsSent: totalSent,
    openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
    bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
    interested: totalInterested,
  };
}
