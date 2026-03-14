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
