import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "EUR"): string {
  if (!isFinite(value)) return "N/A";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (!isFinite(value)) return "N/A";
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

export function formatPercent(value: number): string {
  if (!isFinite(value)) return "N/A";
  return `${value.toFixed(2)}%`;
}

export function formatKPI(value: number, format: string): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "number":
      return formatNumber(value);
    case "percent":
      return formatPercent(value);
    default:
      return String(value);
  }
}

/**
 * Parse LinkedIn API raw text formatting into human-readable text.
 * - Mentions: @[Name](urn:li:organization:123) → @Name
 * - Hashtags: {hashtag|\#|tag} → #tag
 */
export function parseLinkedInText(text: string): string {
  if (!text) return text;
  return text
    // @[auum](urn:li:organization:18897201) → @auum
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")
    // {hashtag|\#|réemploi} → #réemploi
    .replace(/\{hashtag\|\\#\|([^}]+)\}/g, "#$1");
}
