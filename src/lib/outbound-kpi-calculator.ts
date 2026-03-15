import type { LemlistCampaignStats, AbxStats, OutboundKPIs } from "./types";

export function computeOutboundKPIs(stats: LemlistCampaignStats[], abxStats: AbxStats): OutboundKPIs {
  const totalEmailSent = stats.reduce((sum, s) => sum + s.sent, 0);
  const totalEmailOpened = stats.reduce((sum, s) => sum + s.opened, 0);
  const totalEmailReplied = stats.reduce((sum, s) => sum + s.replied, 0);

  const totalLiInvites = stats.reduce((sum, s) => sum + s.liInvites, 0);
  const totalLiAccepted = stats.reduce((sum, s) => sum + s.liAccepted, 0);
  const totalLiReplied = stats.reduce((sum, s) => sum + s.liReplied, 0);

  const totalContacted = totalEmailSent + totalLiInvites;

  return {
    // Cross-channel
    totalContacted,
    totalReplies: totalEmailReplied + totalLiReplied,
    // ABX funnel (% of total contacts)
    mqlRate: abxStats.total > 0 ? (abxStats.mql / abxStats.total) * 100 : 0,
    sqlRate: abxStats.total > 0 ? (abxStats.sql / abxStats.total) * 100 : 0,
    dealRate: abxStats.total > 0 ? (abxStats.deal / abxStats.total) * 100 : 0,
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
