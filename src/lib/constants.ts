import type { Region } from "./types";

export const REGIONS: Region[] = ["Global", "FR", "UK", "DACH"];

export const REGION_LABELS: Record<Region, string> = {
  Global: "Global",
  FR: "France",
  UK: "United Kingdom",
  DACH: "DACH",
};

export const REGION_KEYWORDS: Record<Exclude<Region, "Global">, string[]> = {
  FR: ["france", "french"],
  UK: ["uk", "united kingdom", "britain", "gb", "english"],
  DACH: ["dach", "germany", "austria", "switzerland", "german", "deutsch"],
};

export const GEO_URN_TO_REGION: Record<string, Region> = {
  "urn:li:geo:105015875": "FR",
  "urn:li:geo:101165590": "UK",
  "urn:li:geo:101282230": "DACH",
  "urn:li:geo:103883259": "DACH",
  "urn:li:geo:106693272": "DACH",
};

export const KPI_CONFIG = [
  { key: "budget", label: "Dépenses", format: "currency" },
  { key: "impressions", label: "Impressions", format: "number" },
  { key: "cpm", label: "CPM", format: "currency" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "clicks", label: "Clics", format: "number" },
  { key: "cpl", label: "CPL", format: "currency" },
  { key: "leads", label: "Leads", format: "number" },
] as const;
