/**
 * ABX Data Processing Script
 *
 * Matches companies across 3 sources:
 * 1. LinkedIn Ads (companies reached by paid ads)
 * 2. Lemlist (outbound leads with company domains)
 * 3. Microsoft Dynamics (prospects + devis/quotes)
 *
 * Matching strategy (multi-pass, domain-first):
 * - Pass 1: Exact domain match (most reliable)
 * - Pass 2: LinkedIn company page slug match
 * - Pass 3: Normalized company name match (fallback)
 */

import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const DATA_DIR = path.join(process.cwd(), "data");
const IMPORTS_DIR = path.join(DATA_DIR, "imports");

// ── Helpers ─────────────────────────────────────────────────────────

function normalize(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract meaningful tokens from a company name for fuzzy matching */
function tokenize(name: string): string[] {
  const STOP_WORDS = new Set([
    "sa", "sas", "sarl", "srl", "ltd", "inc", "gmbh", "ag", "se", "nv",
    "group", "groupe", "france", "paris", "europe", "international",
    "the", "de", "du", "des", "la", "le", "les", "et", "and", "for",
  ]);
  return normalize(name)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const c of line) {
    if (c === '"') inQuotes = !inQuotes;
    else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += c;
  }
  result.push(current.trim());
  return result;
}

function excelSerialToISO(serial: number): string {
  const d = new Date((serial - 25569) * 86400000);
  return d.toISOString().slice(0, 10);
}

function writeJSON(filename: string, data: unknown, minify = false) {
  const json = minify ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(DATA_DIR, filename), json);
  console.log(`  ✓ ${filename} (${(json.length / 1024).toFixed(0)} KB)`);
}

// ── Types ───────────────────────────────────────────────────────────

interface LinkedInAdCompany {
  name: string;
  linkedinUrl: string;
  slug: string;
  engagement: string;
  paidImpressions: number;
  paidClicks: number;
  paidEngagements: number;
  paidLeads: number;
}

interface DynamicsProspect {
  id: string;
  fullName: string;
  companyName: string;
  status: string;
  createdAt: string;
  owner: string;
}

interface DynamicsDevis {
  id: string;
  name: string;
  status: string;
  amount: number;
  clientName: string;
  email: string;
  createdAt: string;
}

interface LemlistLead {
  email: string;
  companyName: string;
  companyDomain: string;
  companyLinkedinUrl: string;
  campaign: string;
}

interface ABXCompany {
  name: string;
  domain: string;
  linkedinUrl: string;
  // LinkedIn Ads
  paidImpressions: number;
  paidClicks: number;
  paidEngagements: number;
  paidLeads: number;
  paidEngagement: string; // engagement level
  // Outbound (Lemlist)
  outboundLeads: number;
  outboundCampaigns: string[];
  // Dynamics CRM
  prospects: number;
  prospectStatuses: Record<string, number>;
  devisCount: number;
  devisWon: number;
  devisActive: number;
  pipeline: number; // active devis amount
  revenue: number; // won devis amount
  // Influence
  influencedByPaid: boolean;
  influencedByOutbound: boolean;
  inCRM: boolean;
  earliestCRMDate: string; // YYYY-MM-DD — earliest prospect or devis creation
}

// ── Data Loading ────────────────────────────────────────────────────

function loadLinkedInAds(): LinkedInAdCompany[] {
  const csvPath = path.join(IMPORTS_DIR, "linkedin-ads-companies.csv");
  if (!fs.existsSync(csvPath)) return [];
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n").filter((l) => l.trim());
  const result: LinkedInAdCompany[] = [];
  for (let i = 1; i < lines.length; i++) {
    const v = parseCSVLine(lines[i]);
    const url = v[1] || "";
    result.push({
      name: v[0],
      linkedinUrl: url,
      slug: url.replace("https://www.linkedin.com/company/", "").replace(/\/$/, ""),
      engagement: v[2] || "",
      paidImpressions: parseInt(v[5]) || 0,
      paidClicks: parseInt(v[6]) || 0,
      paidEngagements: parseInt(v[7]) || 0,
      paidLeads: parseInt(v[9]) || 0,
    });
  }
  console.log(`  LinkedIn Ads: ${result.length} companies loaded`);
  return result;
}

function loadDynamicsProspects(): DynamicsProspect[] {
  const xlsxPath = path.join(IMPORTS_DIR, "dynamics-prospects.xlsx");
  if (!fs.existsSync(xlsxPath)) return [];
  const wb = XLSX.readFile(xlsxPath);
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]]);
  const result = rows.map((r) => ({
    id: r["(Ne pas modifier) Prospect"] || "",
    fullName: (r[" Nom complet"] || "").trim(),
    companyName: (r["Nom de la société"] || "").trim(),
    status: r["Status Reason"] || "",
    createdAt: r["Création le"] ? excelSerialToISO(r["Création le"]) : "",
    owner: r["Propriétaire"] || "",
  }));
  console.log(`  Dynamics Prospects: ${result.length} loaded`);
  return result;
}

function loadDynamicsDevis(): DynamicsDevis[] {
  const xlsxPath = path.join(IMPORTS_DIR, "dynamics-devis.xlsx");
  if (!fs.existsSync(xlsxPath)) return [];
  const wb = XLSX.readFile(xlsxPath);
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]]);
  const result = rows.map((r) => ({
    id: r["(Ne pas modifier) Devis"] || "",
    name: (r["Nom du devis"] || "").trim(),
    status: r["Statut"] || "",
    amount: r["Montant total"] || 0,
    clientName: (r["Client potentiel"] || "").trim(),
    email: (r["Courrier électronique (Client potentiel) (Contact)"] || "").trim(),
    createdAt: r["Created On"] ? excelSerialToISO(r["Created On"]) : "",
  }));
  console.log(`  Dynamics Devis: ${result.length} loaded`);
  return result;
}

async function loadLemlistLeads(): Promise<LemlistLead[]> {
  const apiKey = process.env.LEMLIST_API_KEY || "";
  if (!apiKey) {
    console.log("  Lemlist: no API key, skipping");
    return [];
  }
  const authHeader = `Basic ${Buffer.from(`:${apiKey}`).toString("base64")}`;

  // Get all campaigns
  const campRes = await fetch("https://api.lemlist.com/api/campaigns", {
    headers: { Authorization: authHeader },
  });
  const campaigns = (await campRes.json()) as any[];

  const allLeads: LemlistLead[] = [];
  for (const camp of campaigns) {
    try {
      const r = await fetch(
        `https://api.lemlist.com/api/campaigns/${camp._id}/export?state=all`,
        { headers: { Authorization: authHeader } }
      );
      const text = await r.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length <= 1) continue;

      const headers = lines[0].split(",");
      const emailIdx = headers.indexOf("email");
      const companyIdx = headers.indexOf("companyName");
      const domainIdx = headers.indexOf("companyDomain");
      const liUrlIdx = headers.indexOf("companyLinkedinUrl");

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",");
        const email = vals[emailIdx] || "";
        const company = vals[companyIdx] || "";
        const domain = vals[domainIdx] || "";
        const liUrl = vals[liUrlIdx] || "";
        if (company || domain || email) {
          allLeads.push({
            email,
            companyName: company,
            companyDomain: domain.toLowerCase(),
            companyLinkedinUrl: liUrl,
            campaign: camp.name,
          });
        }
      }
      await new Promise((r) => setTimeout(r, 150));
    } catch {
      // Skip failed campaigns
    }
  }
  console.log(`  Lemlist: ${allLeads.length} leads loaded`);
  return allLeads;
}

// ── Matching Engine ─────────────────────────────────────────────────

function buildDomainRegistry(lemlistLeads: LemlistLead[]) {
  // domain -> company name (canonical)
  const domainToCompany = new Map<string, string>();
  // company name (normalized) -> domain
  const companyToDomain = new Map<string, string>();
  // LinkedIn slug -> domain
  const slugToDomain = new Map<string, string>();

  for (const lead of lemlistLeads) {
    const domain = lead.companyDomain || lead.email?.split("@")[1]?.toLowerCase() || "";
    const company = lead.companyName;
    const liUrl = lead.companyLinkedinUrl || "";
    const slug = liUrl
      .replace("https://www.linkedin.com/company/", "")
      .replace(/\/$/, "");

    if (domain && company) {
      // Skip generic email providers
      if (
        !domain.match(
          /^(gmail|yahoo|hotmail|outlook|live|aol|icloud|protonmail|orange|free|sfr|wanadoo|laposte)\./
        )
      ) {
        if (!domainToCompany.has(domain)) domainToCompany.set(domain, company);
        const norm = normalize(company);
        if (!companyToDomain.has(norm)) companyToDomain.set(norm, domain);
      }
    }
    if (slug && domain) {
      if (!slugToDomain.has(slug)) slugToDomain.set(slug, domain);
    }
  }

  console.log(`  Domain registry: ${domainToCompany.size} domains, ${companyToDomain.size} company names, ${slugToDomain.size} slugs`);
  return { domainToCompany, companyToDomain, slugToDomain };
}

function matchCompanyToDomain(
  name: string,
  registry: ReturnType<typeof buildDomainRegistry>
): string | null {
  const norm = normalize(name);

  // Pass 1: exact normalized name match
  const direct = registry.companyToDomain.get(norm);
  if (direct) return direct;

  // Pass 2: token-based fuzzy match
  const tokens = tokenize(name);
  if (tokens.length === 0) return null;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [regName, domain] of registry.companyToDomain) {
    const regTokens = tokenize(regName);
    if (regTokens.length === 0) continue;

    // Count matching tokens
    const matchingTokens = tokens.filter((t) => regTokens.includes(t));
    const score =
      (matchingTokens.length * 2) / (tokens.length + regTokens.length);

    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestMatch = domain;
    }
  }

  return bestMatch;
}

// ── Main Processing ─────────────────────────────────────────────────

async function main() {
  console.log("Processing ABX data...\n");

  // Load all sources
  console.log("Loading data sources:");
  const liAds = loadLinkedInAds();
  const prospects = loadDynamicsProspects();
  const devis = loadDynamicsDevis();

  // Skip processing if no import files are available (Vercel build without imports)
  // This lets the data-loader fall back to data-static/ with pre-computed data
  if (liAds.length === 0 && prospects.length === 0 && devis.length === 0) {
    console.log("\n  No import files found — skipping ABX processing (will use data-static fallback)");
    return;
  }

  const lemlistLeads = await loadLemlistLeads();

  // LinkedIn Ads period: 180 days before export date
  // Only prospects/devis created AFTER this date can be "influenced" by paid ads
  const LI_ADS_CSV = path.join(IMPORTS_DIR, "linkedin-ads-companies.csv");
  const exportStat = fs.existsSync(LI_ADS_CSV) ? fs.statSync(LI_ADS_CSV) : null;
  const exportDate = exportStat ? new Date(exportStat.mtime) : new Date();
  const adsPeriodStart = new Date(exportDate);
  adsPeriodStart.setDate(adsPeriodStart.getDate() - 180);
  const adsPeriodStartISO = adsPeriodStart.toISOString().slice(0, 10);
  console.log(`\n  LinkedIn Ads period: ${adsPeriodStartISO} → ${exportDate.toISOString().slice(0, 10)}`);
  console.log(`  Only prospects/devis created after ${adsPeriodStartISO} count as "influenced by paid"`);

  // Build domain registry from Lemlist leads
  console.log("\nBuilding domain registry:");
  const registry = buildDomainRegistry(lemlistLeads);

  // Also add domains from devis emails
  for (const d of devis) {
    if (d.email) {
      const domain = d.email.split("@")[1]?.toLowerCase();
      if (domain && !registry.domainToCompany.has(domain)) {
        registry.domainToCompany.set(domain, d.clientName);
        registry.companyToDomain.set(normalize(d.clientName), domain);
      }
    }
  }

  // ── Build unified company map keyed by domain ──

  const companies = new Map<string, ABXCompany>();

  function getOrCreate(domain: string, name: string): ABXCompany {
    const key = domain || normalize(name);
    let company = companies.get(key);
    if (!company) {
      company = {
        name,
        domain,
        linkedinUrl: "",
        paidImpressions: 0,
        paidClicks: 0,
        paidEngagements: 0,
        paidLeads: 0,
        paidEngagement: "",
        outboundLeads: 0,
        outboundCampaigns: [],
        prospects: 0,
        prospectStatuses: {},
        devisCount: 0,
        devisWon: 0,
        devisActive: 0,
        pipeline: 0,
        revenue: 0,
        influencedByPaid: false,
        influencedByOutbound: false,
        inCRM: false,
        earliestCRMDate: "",
      };
      companies.set(key, company);
    }
    return company;
  }

  // ── Pass 1: Index LinkedIn Ads companies ──

  console.log("\nMatching LinkedIn Ads companies:");
  let liMatched = 0;
  for (const li of liAds) {
    // Try slug-based domain first
    let domain = registry.slugToDomain.get(li.slug) || "";
    if (!domain) {
      domain = matchCompanyToDomain(li.name, registry) || "";
    }

    const company = getOrCreate(domain, li.name);
    company.paidImpressions += li.paidImpressions;
    company.paidClicks += li.paidClicks;
    company.paidEngagements += li.paidEngagements;
    company.paidLeads += li.paidLeads;
    company.paidEngagement = li.engagement;
    company.linkedinUrl = li.linkedinUrl;
    company.influencedByPaid = true;
    if (domain) liMatched++;
  }
  console.log(`  ${liMatched}/${liAds.length} matched to domains`);

  // ── Pass 2: Index Lemlist leads (outbound) ──

  console.log("\nIndexing Lemlist outbound leads:");
  const outboundByDomain = new Map<string, { count: number; campaigns: Set<string> }>();
  for (const lead of lemlistLeads) {
    const domain =
      lead.companyDomain || lead.email?.split("@")[1]?.toLowerCase() || "";
    if (!domain) continue;
    const existing = outboundByDomain.get(domain) || { count: 0, campaigns: new Set() };
    existing.count++;
    existing.campaigns.add(lead.campaign);
    outboundByDomain.set(domain, existing);
  }
  for (const [domain, data] of outboundByDomain) {
    const name = registry.domainToCompany.get(domain) || domain;
    const company = getOrCreate(domain, name);
    company.outboundLeads += data.count;
    company.outboundCampaigns = [...new Set([...company.outboundCampaigns, ...data.campaigns])];
    company.influencedByOutbound = true;
  }
  console.log(`  ${outboundByDomain.size} companies with outbound activity`);

  // ── Pass 3: Index Dynamics Prospects ──

  console.log("\nMatching Dynamics prospects:");
  let prospectMatched = 0;
  let prospectAfterAds = 0;
  for (const p of prospects) {
    if (!p.companyName) continue;
    const domain = matchCompanyToDomain(p.companyName, registry) || "";
    const company = getOrCreate(domain, p.companyName);
    company.prospects++;
    company.prospectStatuses[p.status] = (company.prospectStatuses[p.status] || 0) + 1;
    company.inCRM = true;
    // Track earliest CRM date for this company (for temporal filtering)
    if (p.createdAt && (!company.earliestCRMDate || p.createdAt < company.earliestCRMDate)) {
      company.earliestCRMDate = p.createdAt;
    }
    if (p.createdAt >= adsPeriodStartISO) prospectAfterAds++;
    if (domain) prospectMatched++;
  }
  console.log(`  ${prospectMatched}/${prospects.length} matched to domains`);
  console.log(`  ${prospectAfterAds} prospects created after ads period (${adsPeriodStartISO})`);

  // ── Pass 4: Index Dynamics Devis ──

  console.log("\nMatching Dynamics devis:");
  let devisMatched = 0;

  // Group devis by client name and try to match to domain
  // First, try to extract company name from devis name (format: "CompanyName - details")
  for (const d of devis) {
    const clientName = d.clientName || "";
    // Try domain from email first
    let domain = d.email ? d.email.split("@")[1]?.toLowerCase() || "" : "";
    if (!domain) {
      domain = matchCompanyToDomain(clientName, registry) || "";
    }
    // Also try extracting company from devis name
    if (!domain && d.name) {
      const parts = d.name.split(" - ");
      if (parts.length > 1) {
        domain = matchCompanyToDomain(parts[0].replace(/^\([^)]+\)\s*/, ""), registry) || "";
      }
    }

    const company = getOrCreate(domain, clientName || d.name);
    company.devisCount++;
    company.inCRM = true;
    // Track earliest CRM date
    if (d.createdAt && (!company.earliestCRMDate || d.createdAt < company.earliestCRMDate)) {
      company.earliestCRMDate = d.createdAt;
    }
    if (d.status === "Conclue") {
      company.devisWon++;
      company.revenue += d.amount;
    } else if (d.status === "Actif") {
      company.devisActive++;
      company.pipeline += d.amount;
    }
    if (domain) devisMatched++;
  }
  console.log(`  ${devisMatched}/${devis.length} matched to domains`);

  // ── Temporal influence filter ──
  // A company is "influenced by paid" only if it entered the CRM
  // AFTER the LinkedIn Ads period started (ads preceded the CRM entry)

  const allCompanies = [...companies.values()];
  let paidInfluenceFiltered = 0;
  for (const c of allCompanies) {
    if (c.influencedByPaid && c.inCRM && c.earliestCRMDate) {
      if (c.earliestCRMDate < adsPeriodStartISO) {
        // Company entered CRM BEFORE ads started — not influenced by paid
        c.influencedByPaid = false;
        paidInfluenceFiltered++;
      }
    }
  }
  console.log(`\n  Temporal filter: ${paidInfluenceFiltered} companies removed from paid influence (entered CRM before ${adsPeriodStartISO})`);

  // ── Compute summary stats ──

  const influenced = allCompanies.filter(
    (c) => (c.influencedByPaid || c.influencedByOutbound) && c.inCRM
  );
  const influencedWithDevis = influenced.filter((c) => c.devisCount > 0);
  const influencedWithWon = influenced.filter((c) => c.devisWon > 0);

  console.log("\n=== ABX SUMMARY ===");
  console.log(`Total unique companies: ${allCompanies.length}`);
  console.log(`Companies reached by Paid: ${allCompanies.filter((c) => c.influencedByPaid).length}`);
  console.log(`Companies reached by Outbound: ${allCompanies.filter((c) => c.influencedByOutbound).length}`);
  console.log(`Companies in CRM: ${allCompanies.filter((c) => c.inCRM).length}`);
  console.log(`Influenced (touched + in CRM): ${influenced.length}`);
  console.log(`Influenced with devis: ${influencedWithDevis.length}`);
  console.log(`Influenced with won deals: ${influencedWithWon.length}`);
  console.log(
    `Influenced pipeline: ${influencedWithDevis.reduce((s, c) => s + c.pipeline, 0).toFixed(0)}€`
  );
  console.log(
    `Influenced revenue: ${influencedWithWon.reduce((s, c) => s + c.revenue, 0).toFixed(0)}€`
  );

  // ── Output JSON ──

  // Only keep companies that are influenced AND in CRM, or have devis/revenue
  const output = allCompanies
    .filter((c) =>
      ((c.influencedByPaid || c.influencedByOutbound) && c.inCRM) ||
      c.devisCount > 0 || c.revenue > 0
    )
    .sort((a, b) => {
      // Influenced companies first
      const aInf = (a.influencedByPaid || a.influencedByOutbound) && a.inCRM ? 1 : 0;
      const bInf = (b.influencedByPaid || b.influencedByOutbound) && b.inCRM ? 1 : 0;
      if (aInf !== bInf) return bInf - aInf;
      // Then by revenue
      if (a.revenue !== b.revenue) return b.revenue - a.revenue;
      // Then by pipeline
      if (a.pipeline !== b.pipeline) return b.pipeline - a.pipeline;
      // Then by impressions
      return b.paidImpressions - a.paidImpressions;
    });

  // Compute ad spend from LinkedIn Ads API data
  const analyticsPath = path.join(DATA_DIR, "analytics.json");
  let totalAdSpend = 0;
  if (fs.existsSync(analyticsPath)) {
    const analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf-8"));
    totalAdSpend = analytics.reduce(
      (s: number, a: any) => s + (a.costInLocalCurrency || 0),
      0
    );
  }

  const summary = {
    totalCompanies: output.length,
    companiesReachedByPaid: allCompanies.filter((c) => c.influencedByPaid).length,
    companiesReachedByOutbound: allCompanies.filter((c) => c.influencedByOutbound).length,
    companiesInCRM: allCompanies.filter((c) => c.inCRM).length,
    influencedCount: influenced.length,
    influencedWithDevis: influencedWithDevis.length,
    influencedWithWon: influencedWithWon.length,
    influencedPipeline: influencedWithDevis.reduce((s, c) => s + c.pipeline, 0),
    influencedRevenue: influencedWithWon.reduce((s, c) => s + c.revenue, 0),
    totalAdSpend,
    pipelineEfficiency:
      totalAdSpend > 0
        ? influencedWithDevis.reduce((s, c) => s + c.pipeline, 0) / totalAdSpend
        : 0,
    roas:
      totalAdSpend > 0
        ? influencedWithWon.reduce((s, c) => s + c.revenue, 0) / totalAdSpend
        : 0,
    // Funnel
    funnel: {
      reached: allCompanies.filter((c) => c.influencedByPaid || c.influencedByOutbound).length,
      inCRM: influenced.length,
      withDevis: influencedWithDevis.length,
      won: influencedWithWon.length,
    },
  };

  console.log("\nWriting output files:");
  writeJSON("abx-companies.json", output, true);
  writeJSON("abx-summary.json", summary);

  // Also copy to data-static/ for committed fallback (when imports are available)
  const staticDir = path.join(process.cwd(), "data-static");
  if (output.length > 0 && fs.existsSync(staticDir)) {
    fs.writeFileSync(path.join(staticDir, "abx-companies.json"), JSON.stringify(output));
    fs.writeFileSync(path.join(staticDir, "abx-summary.json"), JSON.stringify(summary, null, 2));
    console.log("  ✓ Updated data-static/ fallback");
  }
  console.log("\nDone!");
}

main().catch(console.error);
