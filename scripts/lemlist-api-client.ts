import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "https://api.lemlist.com/api";

export class LemlistAPIClient {
  private authHeader: string;

  constructor() {
    const apiKey = process.env.LEMLIST_API_KEY || "";
    if (!apiKey) {
      throw new Error("LEMLIST_API_KEY not set.");
    }
    // HTTP Basic Auth: empty username, API key as password
    this.authHeader = `Basic ${Buffer.from(`:${apiKey}`).toString("base64")}`;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;
    let retries = 3;
    while (retries > 0) {
      const res = await fetch(url, {
        headers: { Authorization: this.authHeader },
      });
      if (res.status === 429) {
        const wait = parseInt(res.headers.get("Retry-After") || "5", 10);
        console.warn(`  Rate limited. Retrying in ${wait}s...`);
        await sleep(wait * 1000);
        retries--;
        continue;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Lemlist API error ${res.status}: ${body}`);
      }
      return (await res.json()) as T;
    }
    throw new Error("Max retries exceeded due to rate limiting");
  }

  async getCampaigns(): Promise<Array<{
    _id: string;
    name: string;
    status: string;
    labels: string[];
    createdAt: string;
    createdBy: string;
  }>> {
    const result = await this.request<any>("/campaigns");
    return result || [];
  }

  async getActivities(params: {
    campaignId?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params.campaignId) qs.set("campaignId", params.campaignId);
    if (params.type) qs.set("type", params.type);
    qs.set("limit", String(params.limit || 100));
    qs.set("offset", String(params.offset || 0));
    const result = await this.request<any>(`/activities?${qs.toString()}`);
    return result || [];
  }

  async getAllActivities(campaignId: string, type: string): Promise<any[]> {
    const all: any[] = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      await sleep(150); // Rate limit protection
      const batch = await this.getActivities({ campaignId, type, limit, offset });
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }
    return all;
  }

  async getLeads(campaignId: string): Promise<Array<{
    _id: string;
    state: string;
    contactId: string;
  }>> {
    const all: any[] = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      await sleep(150);
      const batch = await this.request<any[]>(
        `/campaigns/${campaignId}/leads?limit=${limit}&offset=${offset}`
      );
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }
    return all;
  }

  async getContact(contactId: string): Promise<{
    _id: string;
    fullName?: string;
    email?: string;
    fields?: Record<string, any>;
  }> {
    await sleep(100);
    return this.request<any>(`/contacts/${contactId}`);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
