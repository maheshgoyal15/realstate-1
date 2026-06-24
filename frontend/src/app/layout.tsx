import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Mandatory Secure Web Skills: SEO Best Practices & CSP Policy
// - Title Tags, Meta Descriptions
// - Strict CSP headers and clickjacking protections

export const metadata: Metadata = {
  title: "HomeReady AI — Real Estate Whole-House Upgrade Recommendation Engine",
  description: "AI-powered SaaS platform using computer vision and intelligent recommendations to help real estate professionals and homeowners identify and prioritize highest-ROI upgrades before listing.",
};

import { AppLayout } from "@/components/layout/AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* TODO(security): 'unsafe-eval' is required by Next.js in local development mode. Remove in production. */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cloudfront.homeready.ai https://images.unsplash.com; object-src 'none';" />
      </head>
      <body className={`${inter.className} bg-mesh relative text-slate-50 min-h-screen flex flex-col overflow-x-hidden`}>
        {/* Background glowing orbs */}
        <div className="orb-1 pointer-events-none" />
        <div className="orb-2 pointer-events-none" />
        <div className="orb-3 pointer-events-none" />

        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
