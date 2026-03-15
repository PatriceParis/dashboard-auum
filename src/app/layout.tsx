import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auum - ABX Dashboard",
  description: "Dashboard ABX : LinkedIn Ads & Outbound",
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
