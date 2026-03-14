import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "https://api.linkedin.com";
const API_VERSION = "202509";

interface LinkedInError {
  status: number;
  message: string;
  code?: string;
}

export class LinkedInAPIClient {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || "";
    if (!this.accessToken) {
      throw new Error("LINKEDIN_ACCESS_TOKEN not set. Run 'npm run auth' first.");
    }
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "LinkedIn-Version": API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    };
  }

  // Raw GET with pre-built URL (preserves Rest.li syntax)
  async getRaw<T>(pathWithQuery: string, versionOverride?: string): Promise<T> {
    const fullUrl = `${BASE_URL}${pathWithQuery}`;
    const hdrs = versionOverride
      ? { ...this.headers, "LinkedIn-Version": versionOverride }
      : this.headers;
    let retries = 3;
    while (retries > 0) {
      const res = await fetch(fullUrl, { headers: hdrs });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10);
        console.warn(`Rate limited. Retrying in ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        retries--;
        continue;
      }
      if (res.status === 401) {
        throw new Error("Authentication failed (401). Token may be expired. Run 'npm run auth'.");
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LinkedIn API error ${res.status}: ${body}`);
      }
      return (await res.json()) as T;
    }
    throw new Error("Max retries exceeded due to rate limiting");
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    // Build URL manually to preserve Rest.li syntax (parentheses, colons)
    let fullUrl = `${BASE_URL}${path}`;
    if (params && Object.keys(params).length > 0) {
      const qs = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      fullUrl += `?${qs}`;
    }
    const url = fullUrl;

    let retries = 3;
    while (retries > 0) {
      const res = await fetch(url.toString(), { headers: this.headers });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10);
        console.warn(`Rate limited. Retrying in ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        retries--;
        continue;
      }

      if (res.status === 401) {
        throw new Error("Authentication failed (401). Token may be expired. Run 'npm run auth'.");
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LinkedIn API error ${res.status}: ${body}`);
      }

      return (await res.json()) as T;
    }

    throw new Error("Max retries exceeded due to rate limiting");
  }

  async fetchAllPages<T>(
    pathWithQuery: string,
    maxPages = 10,
    versionOverride?: string
  ): Promise<T[]> {
    const allElements: T[] = [];
    let start = 0;
    const count = 100;
    const separator = pathWithQuery.includes("?") ? "&" : "?";

    for (let page = 0; page < maxPages; page++) {
      const result = await this.getRaw<{ elements: T[]; paging?: { total?: number; count: number; start: number } }>(
        `${pathWithQuery}${separator}start=${start}&count=${count}`,
        versionOverride
      );

      allElements.push(...result.elements);

      if (!result.paging || result.elements.length < count) {
        break;
      }

      start += count;
    }

    return allElements;
  }

  // ── Ad Accounts ──
  async getAdAccounts() {
    return this.getRaw<{ elements: Array<{ id: number; name: string; status: string; currency: string }> }>(
      "/rest/adAccounts?q=search&search=(status:(values:List(ACTIVE)))"
    );
  }

  // ── Campaign Groups ──
  async getCampaignGroups(accountId: number) {
    return this.fetchAllPages<{
      id: number;
      name: string;
      status: string;
      account: string;
    }>(`/rest/adAccounts/${accountId}/adCampaignGroups?q=search&search=(status:(values:List(ACTIVE,PAUSED,ARCHIVED)))`);
  }

  // ── Campaigns ──
  async getCampaigns(accountId: number) {
    return this.fetchAllPages<{
      id: number;
      name: string;
      status: string;
      campaignGroup: string;
      dailyBudget?: { amount: string; currencyCode: string };
      totalBudget?: { amount: string; currencyCode: string };
      costType?: string;
    }>(`/rest/adAccounts/${accountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE,PAUSED,COMPLETED,ARCHIVED)))`);
  }

  // ── Analytics ──
  async getAnalytics(campaignUrns: string[], startYear = 2024, startMonth = 1, startDay = 1) {
    const now = new Date();
    const campaignsList = campaignUrns.map(encodeURIComponent).join(",");
    const dateRange = `(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${now.getFullYear()},month:${now.getMonth() + 1},day:${now.getDate()}))`;

    return this.getRaw<{ elements: Array<{
      impressions: number;
      clicks: number;
      costInLocalCurrency: string;
      externalWebsiteConversions: number;
      landingPageClicks: number;
      pivotValues?: string[];
      pivotValue?: string;
      dateRange?: { start: { year: number; month: number; day: number }; end: { year: number; month: number; day: number } };
    }> }>(`/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&dateRange=${dateRange}&campaigns=List(${campaignsList})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,landingPageClicks,pivotValues,dateRange`);
  }

  // ── Daily Analytics ──
  async getDailyAnalytics(campaignUrns: string[], days = 30) {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const campaignsList = campaignUrns.map(encodeURIComponent).join(",");
    const dateRange = `(start:(year:${start.getFullYear()},month:${start.getMonth() + 1},day:${start.getDate()}),end:(year:${now.getFullYear()},month:${now.getMonth() + 1},day:${now.getDate()}))`;

    return this.getRaw<{ elements: Array<{
      impressions: number;
      clicks: number;
      costInLocalCurrency: string;
      externalWebsiteConversions: number;
      pivotValues?: string[];
      pivotValue?: string;
      dateRange?: { start: { year: number; month: number; day: number }; end: { year: number; month: number; day: number } };
    }> }>(`/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${dateRange}&campaigns=List(${campaignsList})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,pivotValues,dateRange`);
  }

  // ── Creatives (uses legacy v2 API as /rest/ endpoint doesn't support creatives) ──
  async getCreatives(accountId: number) {
    // Get all campaign IDs for this account, then fetch creatives per campaign
    const campaigns = await this.getCampaigns(accountId);
    const allCreatives: Array<{
      id: number;
      reference?: string;
      campaign: string;
      status: string;
      type?: string;
      callToAction?: { labelType?: string; target?: string };
    }> = [];

    for (const campaign of campaigns) {
      try {
        const urn = encodeURIComponent(`urn:li:sponsoredCampaign:${campaign.id}`);
        const res = await fetch(
          `${BASE_URL}/v2/adCreativesV2?q=search&search.campaign.values[0]=${urn}`,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        );
        if (res.ok) {
          const data = await res.json() as { elements: Array<any> };
          for (const el of data.elements) {
            allCreatives.push({
              id: el.id,
              reference: el.reference,
              campaign: el.campaign,
              status: el.status || "ACTIVE",
              type: el.type,
              callToAction: el.callToAction,
            });
          }
        }
      } catch (err) {
        console.warn(`  ⚠ Creatives for campaign ${campaign.id} failed: ${err}`);
      }
    }
    return allCreatives;
  }

  // ── Posts (for creative text) ──
  async getPost(postUrn: string) {
    return this.get<{
      commentary?: string;
      content?: {
        media?: { id: string; title?: string };
        multiImage?: { images: Array<{ id: string }> };
        article?: {
          title?: string;
          description?: string;
          source?: string;
        };
        document?: {
          title?: string;
        };
      };
    }>(`/rest/posts/${encodeURIComponent(postUrn)}`);
  }

  // ── Images ──
  async getImages(imageUrns: string[]) {
    const ids = imageUrns.map(encodeURIComponent).join(",");
    return this.getRaw<{ results: Record<string, { downloadUrl: string }> }>(
      `/rest/images?ids=List(${ids})`
    );
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
