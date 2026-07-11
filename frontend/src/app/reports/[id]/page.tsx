"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  Printer,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/apiClient";

interface Report {
  id: string;
  address: string;
  title: string;
  recsCount: number;
  valueAdd: number;
  cost: number;
  date: string;
  reportUrl: string;
}

export default function SecureReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/reports");
        if (cancelled) return;
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const list: Report[] = await res.json();
        const match = list.find((r) => r.id === id);
        if (!match) {
          setNotFound(true);
        } else {
          setReport(match);
        }
      } catch (error) {
        console.error("Failed to load report:", error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6 animate-in fade-in duration-300">
        <SkeletonCard />
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-in fade-in duration-300">
        <AlertCircle className="w-10 h-10 text-ink-subtle mx-auto" />
        <h1 className="text-xl font-bold text-ink">Report not found</h1>
        <p className="text-ink-muted text-sm">
          This report doesn't exist, or you don't have access to it.
        </p>
        <Button onClick={() => window.location.href = "/reports"}>Back to My Reports</Button>
      </div>
    );
  }

  const roiPercent = report.cost > 0 ? Math.round((report.valueAdd / report.cost) * 100) : 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Report Header */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 card-surface">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-accent-600 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Pre-Listing Upgrade Guide</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-ink tracking-tight">{report.title}</h1>
          <p className="text-ink-muted text-xs">Generated {report.date}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            id="report-dl-pdf"
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => window.open(report.reportUrl, "_blank")}
          >
            Download PDF
          </Button>
          <Button
            id="report-print"
            variant="ghost"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Main Ledger Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: Summary */}
        <div className="lg:col-span-8 space-y-6">
          <Card hoverEffect={false} className="p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-ink tracking-tight">Executive Upgrade Summary</h2>
            <p className="text-ink-muted text-sm leading-relaxed">
              Based on our computer vision analysis of <strong className="text-ink">{report.address}</strong>, this
              report identifies <strong className="text-ink">{report.recsCount} upgrade{report.recsCount === 1 ? "" : "s"}</strong> projected
              to add <strong className="text-success">{formatCurrency(report.valueAdd)}</strong> in
              market value against an estimated <strong className="text-ink">{formatCurrency(report.cost)}</strong> upgrade budget.
            </p>
            <div className="pt-4 border-t border-surface-border">
              <Button variant="secondary" size="sm" onClick={() => window.location.href = "/reports"}>
                View All My Reports
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: Ledger summary widgets */}
        <aside className="lg:col-span-4 space-y-6">
          <Card hoverEffect={false} className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-ink-subtle uppercase tracking-widest text-center">Calculated ROI Summary</h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Total Upgrades Investment:</span>
                <span className="font-extrabold text-ink">{formatCurrency(report.cost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Est. Valuation Lift:</span>
                <span className="font-extrabold text-success">+{formatCurrency(report.valueAdd)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-surface-border pt-3 mt-3">
                <span className="text-ink-muted">Overall ROI Premium:</span>
                <span className="font-extrabold text-success">+{roiPercent}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border">
              <Button
                id="contact-advising-broker"
                variant="secondary"
                className="w-full text-xs"
                disabled
                title="Coming soon"
              >
                Consult Advising Agent (Coming Soon)
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-surface-raised border border-success-border text-success rounded-xl p-4 shadow-card-hover animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-bold">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} aria-label="Dismiss notification" className="text-ink-subtle hover:text-ink font-mono">×</button>
        </div>
      )}
    </div>
  );
}
