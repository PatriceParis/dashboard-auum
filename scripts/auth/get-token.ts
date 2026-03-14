import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3456/callback";
const SCOPES = "r_ads,r_ads_reporting,rw_ads,r_organization_social,r_basicprofile";
const PORT = 3456;

async function exchangeCodeForToken(code: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
  }>;
}

function updateEnvFile(token: string, refreshToken: string, expiresAt: string) {
  const envPath = path.join(process.cwd(), ".env");
  let content = fs.readFileSync(envPath, "utf-8");

  content = content.replace(/LINKEDIN_ACCESS_TOKEN=.*/, `LINKEDIN_ACCESS_TOKEN=${token}`);
  content = content.replace(/LINKEDIN_REFRESH_TOKEN=.*/, `LINKEDIN_REFRESH_TOKEN=${refreshToken}`);
  content = content.replace(/LINKEDIN_TOKEN_EXPIRES_AT=.*/, `LINKEDIN_TOKEN_EXPIRES_AT=${expiresAt}`);

  fs.writeFileSync(envPath, content);
  console.log("✓ .env file updated with new tokens");
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env");
    process.exit(1);
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

  console.log("\n=== LinkedIn OAuth 2.0 Authorization ===\n");
  console.log("1. Open this URL in your browser:\n");
  console.log(authUrl);
  console.log("\n2. Log in and authorize the app");
  console.log("3. You will be redirected back here automatically\n");
  console.log(`Waiting for callback on ${REDIRECT_URI}...\n`);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url!, `http://localhost:${PORT}`);

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h1>Error: ${error}</h1><p>${url.searchParams.get("error_description")}</p>`);
        console.error(`Authorization error: ${error}`);
        server.close();
        process.exit(1);
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Error: No authorization code received</h1>");
        server.close();
        process.exit(1);
      }

      try {
        console.log("Exchanging authorization code for access token...");
        const tokenData = await exchangeCodeForToken(code);

        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

        updateEnvFile(
          tokenData.access_token,
          tokenData.refresh_token || "",
          expiresAt
        );

        console.log(`✓ Access token obtained (expires: ${expiresAt})`);
        if (tokenData.refresh_token) {
          console.log("✓ Refresh token obtained");
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:50px">
            <h1 style="color:#22c55e">✓ Authorization Successful!</h1>
            <p>Access token has been saved to .env</p>
            <p>Expires: ${expiresAt}</p>
            <p>You can close this tab.</p>
          </body></html>
        `);
      } catch (err) {
        console.error("Token exchange failed:", err);
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(`<h1>Error exchanging code</h1><pre>${err}</pre>`);
      }

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    }
  });

  server.listen(PORT, () => {
    console.log(`Local server listening on port ${PORT}`);
  });
}

main();
