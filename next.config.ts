import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No static export — Vercel handles Next.js deployment natively.
  // For self-hosted static use: `output: "export"` + `npm run build`
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
