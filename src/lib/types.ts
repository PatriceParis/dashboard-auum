export interface CampaignGroup {
  id: string;
  name: string;
  status: string;
  region: Region;
}

export type Region = "Global" | "FR" | "UK" | "DACH";

export interface Campaign {
  id: string;
  name: string;
  campaignGroupName?: string;
  status: string;
  campaignGroupId: string;
  region: Region;
  dailyBudget?: number;
  totalBudget?: number;
  costType?: string;
  currency?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  impressions: number;
  clicks: number;
  costInLocalCurrency: number;
  externalWebsiteConversions: number;
  landingPageClicks: number;
  dateRange?: {
    start: { year: number; month: number; day: number };
    end: { year: number; month: number; day: number };
  };
}

export interface DailyAnalytics {
  campaignId: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  costInLocalCurrency: number;
  leads: number;
}

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  adText: string;
  headline?: string;
  mediaType: "image" | "video" | "carousel" | "document" | "unknown";
  localMediaPath: string | null;
  originalMediaUrl?: string;
  landingPageUrl?: string;
}

export interface DashboardData {
  campaignGroups: CampaignGroup[];
  campaigns: Campaign[];
  analytics: CampaignAnalytics[];
  dailyAnalytics: DailyAnalytics[];
  creatives: Creative[];
  lastUpdated: string;
  dataPeriod?: { start: string; end: string };
  lemlist?: LemlistData;
  abx?: ABXData;
}

// ── ABX (Account-Based Experience) ──

export interface ABXCompany {
  name: string;
  domain: string;
  linkedinUrl: string;
  // LinkedIn Ads
  paidImpressions: number;
  paidClicks: number;
  paidEngagements: number;
  paidLeads: number;
  paidEngagement: string;
  // Outbound (Lemlist)
  outboundLeads: number;
  outboundCampaigns: string[];
  // Dynamics CRM
  prospects: number;
  prospectStatuses: Record<string, number>;
  devisCount: number;
  devisWon: number;
  devisActive: number;
  pipeline: number;
  revenue: number;
  // Influence
  influencedByPaid: boolean;
  influencedByOutbound: boolean;
  inCRM: boolean;
}

export interface ABXSummary {
  totalCompanies: number;
  companiesReachedByPaid: number;
  companiesReachedByOutbound: number;
  companiesInCRM: number;
  influencedCount: number;
  influencedWithDevis: number;
  influencedWithWon: number;
  influencedPipeline: number;
  influencedRevenue: number;
  totalAdSpend: number;
  pipelineEfficiency: number;
  roas: number;
  funnel: {
    reached: number;
    inCRM: number;
    withDevis: number;
    won: number;
  };
}

export interface ABXData {
  companies: ABXCompany[];
  summary: ABXSummary;
}

export interface ComputedKPIs {
  budget: number;
  impressions: number;
  cpm: number;
  ctr: number;
  clicks: number;
  cpl: number;
  leads: number;
}

// ── Lemlist Outbound ──

export interface LemlistCampaign {
  id: string;
  name: string;
  status: string;
  labels: string[];
  createdAt: string;
}

export interface LemlistCampaignStats {
  campaignId: string;
  campaignName: string;
  // Email metrics
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  interested: number;
  // LinkedIn metrics
  liInvites: number;
  liAccepted: number;
  liSent: number;
  liReplied: number;
}

export interface LemlistDailyActivity {
  date: string; // YYYY-MM-DD
  campaignId: string;
  // Email metrics
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  // LinkedIn metrics
  liInvites: number;
  liAccepted: number;
  liSent: number;
  liReplied: number;
}

export interface AbxStats {
  total: number;
  mql: number;
  sql: number;
  deal: number;
}

export interface LemlistData {
  campaigns: LemlistCampaign[];
  campaignStats: LemlistCampaignStats[];
  dailyActivities: LemlistDailyActivity[];
  abxStats: AbxStats;
  lastUpdated: string;
}

export interface OutboundKPIs {
  // Cross-channel
  totalContacted: number;
  totalReplies: number;
  // ABX funnel
  mqlRate: number;
  sqlRate: number;
  dealRate: number;
  // Email
  emailsSent: number;
  emailOpenRate: number;
  emailReplyRate: number;
  // LinkedIn
  liInvites: number;
  liAcceptRate: number;
  liReplied: number;
}
