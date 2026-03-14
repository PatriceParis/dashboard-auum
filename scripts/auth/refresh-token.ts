import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.LINKEDIN_REFRESH_TOKEN;
const EXPIRES_AT = process.env.LINKEDIN_TOKEN_EXPIRES_AT;

function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env");
  let content = fs.readFileSync(envPath, "utf-8");
  for (const [key, value] of Object.entries(updates)) {
    content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
  }
  fs.writeFileSync(envPath, content);
}

async function main() {
  // Check expiry
  if (EXPIRES_AT) {
    const expiresDate = new Date(EXPIRES_AT);
    const daysUntilExpiry = (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry > 7) {
      console.log(`✓ Token valid for ${Math.round(daysUntilExpiry)} more days (expires ${EXPIRES_AT})`);
      return;
    }

    if (daysUntilExpiry <= 0) {
      console.error("✗ Token has EXPIRED. Run 'npm run auth' to get a new token.");
      process.exit(1);
    }

    console.warn(`⚠ Token expires in ${Math.round(daysUntilExpiry)} days!`);
  }

  if (!REFRESH_TOKEN) {
    console.warn("⚠ No refresh token available. Run 'npm run auth' to get a new token before expiry.");
    return;
  }

  console.log("Refreshing access token...");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Token refresh failed (${res.status}): ${err}`);
    console.error("Run 'npm run auth' to get a new token.");
    process.exit(1);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  updateEnvFile({
    LINKEDIN_ACCESS_TOKEN: data.access_token,
    LINKEDIN_TOKEN_EXPIRES_AT: expiresAt,
    ...(data.refresh_token ? { LINKEDIN_REFRESH_TOKEN: data.refresh_token } : {}),
  });

  console.log(`✓ Token refreshed (expires: ${expiresAt})`);
}

main().catch((err) => {
  console.error("Refresh failed:", err);
  process.exit(1);
});
