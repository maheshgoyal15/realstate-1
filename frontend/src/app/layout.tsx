import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HomeReady AI — Real Estate Whole-House Upgrade Recommendation Engine",
  description: "AI-powered SaaS platform using computer vision and intelligent recommendations to help real estate professionals and homeowners identify and prioritize highest-ROI upgrades before listing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101a2e",
};

import { AppLayout } from "@/components/layout/AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} font-sans min-h-screen flex flex-col overflow-x-hidden`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
