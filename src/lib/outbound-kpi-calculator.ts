import type { LemlistCampaignStats, OutboundKPIs } from "./types";

export function computeOutboundKPIs(stats: LemlistCampaignStats[]): OutboundKPIs {
  const totalEmailSent = stats.reduce((sum, s) => sum + s.sent, 0);
  const totalEmailOpened = stats.reduce((sum, s) => sum + s.opened, 0);
  const totalEmailReplied = stats.reduce((sum, s) => sum + s.replied, 0);
  const totalInterested = stats.reduce((sum, s) => sum + s.interested, 0);

  const totalLiInvites = stats.reduce((sum, s) => sum + s.liInvites, 0);
  const totalLiAccepted = stats.reduce((sum, s) => sum + s.liAccepted, 0);
  const totalLiReplied = stats.reduce((sum, s) => sum + s.liReplied, 0);

  return {
    // Cross-channel
    totalContacted: totalEmailSent + totalLiInvites,
    totalReplies: totalEmailReplied + totalLiReplied,
    interested: totalInterested,
    // Email
    emailsSent: totalEmailSent,
    emailOpenRate: totalEmailSent > 0 ? (totalEmailOpened / totalEmailSent) * 100 : 0,
    emailReplyRate: totalEmailSent > 0 ? (totalEmailReplied / totalEmailSent) * 100 : 0,
    // LinkedIn
    liInvites: totalLiInvites,
    liAcceptRate: totalLiInvites > 0 ? (totalLiAccepted / totalLiInvites) * 100 : 0,
    liReplied: totalLiReplied,
  };
}
