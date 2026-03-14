import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const csvPath = resolve(
  "C:/Users/patri/Downloads/account_504986107_creative_performance_report.csv"
);
const outputPath = resolve(__dirname, "../data/creatives.json");

// Read UTF-16LE file
const buf = readFileSync(csvPath);
const raw = buf.toString("utf16le");

// Remove BOM if present
const content = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

// Split into lines - but handle multi-line quoted fields
// We need to properly parse CSV with tab separator and quoted fields containing newlines
function parseCSV(text: string, delimiter = "\t"): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ""
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        currentRow.push(currentField);
        currentField = "";
      } else if (ch === "\n") {
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
      } else if (ch === "\r") {
        // skip
      } else {
        currentField += ch;
      }
    }
  }

  // Push last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

const allRows = parseCSV(content);

// Find the header row (contains "ID Pub")
let headerIdx = -1;
for (let i = 0; i < allRows.length; i++) {
  if (allRows[i].some((cell) => cell.includes("ID Pub"))) {
    headerIdx = i;
    break;
  }
}

if (headerIdx === -1) {
  console.error("Could not find header row!");
  process.exit(1);
}

const headers = allRows[headerIdx];
console.log(`Header row at index ${headerIdx}, ${headers.length} columns`);

// Map column names to indices
const colIdx: Record<string, number> = {};
headers.forEach((h, i) => {
  colIdx[h.trim()] = i;
});

// Key columns
const COL_CAMPAIGN_ID = colIdx["ID de la campagne"];
const COL_AD_NAME = colIdx["Nom de la publicité"];
const COL_AD_ID = colIdx["ID Pub"];
const COL_AD_STATUS = colIdx["Statut de la publicité"];
const COL_AD_TEXT = colIdx["Texte pub présentation"];
const COL_HEADLINE = colIdx["Titre de la publicité"];
const COL_CAMPAIGN_GROUP = colIdx["Nom du groupe de campagnes"];
const COL_LANDING_URL = colIdx["URL à cliquer"];

console.log("Column indices:", {
  COL_CAMPAIGN_ID,
  COL_AD_NAME,
  COL_AD_ID,
  COL_AD_STATUS,
  COL_AD_TEXT,
  COL_HEADLINE,
  COL_CAMPAIGN_GROUP,
  COL_LANDING_URL,
});

// Data rows
const dataRows = allRows.slice(headerIdx + 1).filter((r) => r.length > 10);

// Deduplicate by ad ID - keep first occurrence
const seen = new Set<string>();
interface Creative {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  adText: string;
  headline: string;
  mediaType: string;
  localMediaPath: null;
  landingPageUrl: string;
}

const creatives: Creative[] = [];

for (const row of dataRows) {
  const adId = row[COL_AD_ID]?.trim();
  if (!adId || seen.has(adId)) continue;
  seen.add(adId);

  const adText = row[COL_AD_TEXT]?.trim() || "";
  const headline = row[COL_HEADLINE]?.trim() || "";
  const name = row[COL_AD_NAME]?.trim() || "";
  const status = row[COL_AD_STATUS]?.trim() || "";
  const campaignId = row[COL_CAMPAIGN_ID]?.trim() || "";
  const landingPageUrl = row[COL_LANDING_URL]?.trim() || "";

  if (status !== "Actif") continue;

  creatives.push({
    id: `creative_${adId}`,
    campaignId,
    name,
    status: "ACTIVE",
    adText,
    headline,
    mediaType: "document",
    localMediaPath: null,
    landingPageUrl: landingPageUrl || "docs.google.com",
  });
}

// Sort by campaign ID then ad ID
creatives.sort((a, b) => {
  if (a.campaignId !== b.campaignId) return a.campaignId.localeCompare(b.campaignId);
  return a.id.localeCompare(b.id);
});

console.log(`\nFound ${creatives.length} active creatives:\n`);
for (const c of creatives) {
  console.log(`  ${c.id} | ${c.campaignId} | ${c.name}`);
  console.log(`    headline: ${c.headline.substring(0, 60)}...`);
  console.log(`    adText: ${c.adText.substring(0, 60)}...`);
  console.log();
}

writeFileSync(outputPath, JSON.stringify(creatives, null, 2), "utf-8");
console.log(`\nWrote ${creatives.length} creatives to ${outputPath}`);
