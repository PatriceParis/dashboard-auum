import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberVadis - LinkedIn Ads Dashboard",
  description: "Dashboard de suivi des campagnes LinkedIn Ads par region",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
