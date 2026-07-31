"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  CheckCircle,
  Eye,
  Trash2,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/apiClient";

interface AnalysisSummary {
  id: string;
  address: string;
  date: string;
  status: "status-complete" | "status-progress" | "status-error";
  statusLabel: string;
  roi: number | null;
  cost: number;
  reportUrl: string | null;
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/analyses");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setAnalyses(data);
      } catch (error) {
        console.error("Failed to load analyses:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const roiValues = analyses.map(a => a.roi).filter((r): r is number => typeof r === "number");
    const avgRoi = roiValues.length > 0 ? roiValues.reduce((sum, r) => sum + r, 0) / roiValues.length : null;
    const reportsCount = analyses.filter(a => a.reportUrl).length;

    return [
      { title: "Analyses", value: String(analyses.length), desc: "Total" },
      { title: "Avg ROI", value: avgRoi !== null ? `${avgRoi.toFixed(1)}%` : "--", desc: "Across completed analyses" },
      { title: "Reports", value: String(reportsCount), desc: "Generated" },
    ];
  }, [analyses]);

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/analyses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnalyses(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete analysis:", error);
    }
  };

  const handleShare = (prop: AnalysisSummary) => {
    if (prop.status !== "status-complete") return;
    setShareUrl(`${window.location.origin}/reports/${prop.id}`);
    setSelectedProperty(prop.address);
    setShareModalOpen(true);
  };

  return (
    <div className="pb-12">
      {/* Page masthead — the one deliberately large element on the screen, so
          hierarchy is obvious at squint distance without a colored banner. */}
      <header className="flex flex-col gap-6 border-b border-surface-border pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl space-y-3">
          <span className="eyebrow">Workspace</span>
          <h1 className="text-4xl">Welcome back, Mahesh</h1>
          <p className="text-sm text-ink-muted">
            Our computer vision model finished scanning your new uploads. Ready to inspect recommended improvements?
          </p>
        </div>
        <Button
          id="hero-analyze-btn"
          variant="accent"
          size="lg"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={() => window.location.href = "/analyze"}
        >
          Analyze New Property
        </Button>
      </header>

      {/* Stat strip — bare figures divided by hairlines rather than three
          identical boxes, so the numbers read as data and not as cards. */}
      <section className="grid grid-cols-1 divide-y divide-surface-border border-b border-surface-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.title} className="py-8 sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <span className="eyebrow">{stat.title}</span>
            <p className="mt-3 text-3xl font-semibold" data-numeric>
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">{stat.desc}</p>
          </div>
        ))}
      </section>

      {/* Recent Analyses Table */}
      <section className="space-y-4 pt-10">
        <h2 className="text-xl">Recent Property Analyses</h2>
        {analyses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-ink-muted">
              No analyses yet. Upload your first property to get started.
            </p>
          </Card>
        ) : (
        <Table headers={["Property Address", "Date Created", "Analysis Status", "Calculated ROI", "Actions"]}>
          {analyses.map((prop) => (
            <TableRow key={prop.id} id={`row-${prop.id}`}>
              <TableCell className="font-semibold text-ink">{prop.address}</TableCell>
              <TableCell>{prop.date}</TableCell>
              <TableCell>
                <Badge variant={prop.status}>{prop.statusLabel}</Badge>
              </TableCell>
              <TableCell className="font-semibold text-success">
                {typeof prop.roi === "number" ? `${prop.roi.toFixed(1)}%` : "--"}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    id={`view-btn-${prop.id}`}
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (prop.status === "status-complete") {
                        window.location.href = `/analyze/${prop.id}`;
                      }
                    }}
                    disabled={prop.status !== "status-complete"}
                  >
                    View
                  </Button>
                  <Button
                    id={`share-btn-${prop.id}`}
                    variant="ghost"
                    size="sm"
                    icon={<Share2 className="w-3.5 h-3.5" />}
                    onClick={() => handleShare(prop)}
                    disabled={prop.status !== "status-complete"}
                  >
                    Share
                  </Button>
                  <button
                    id={`delete-btn-${prop.id}`}
                    onClick={() => {
                      if (window.confirm(`Delete the analysis for ${prop.address}? This can't be undone.`)) {
                        handleDelete(prop.id);
                      }
                    }}
                    aria-label={`Delete analysis for ${prop.address}`}
                    className="p-2 text-ink-subtle hover:text-danger transition-colors rounded-lg hover:bg-danger-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        )}
      </section>

      {/* Insights — deliberately asymmetric (2fr / 1fr) so the row doesn't read
          as another pair of identical boxes stacked under the table. */}
      <section className="grid grid-cols-1 gap-6 pt-12 lg:grid-cols-3">
        <Card hoverEffect={false} className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-500" />
            <h3 className="eyebrow">Trending Upgrades (Agents Only)</h3>
          </div>
          <p className="max-w-prose text-sm text-ink-muted">
            Among local properties in the Austin MLS region, computer vision audits suggest prioritizing the following elements to secure higher buyer bidding premiums:
          </p>
          <ul className="divide-y divide-surface-border border-t border-surface-border">
            {[
              { name: "Modern Kitchen Remodel", share: "62%" },
              { name: "HVAC Unit Replacement", share: "48%" },
              { name: "Exterior Painting & Siding Audit", share: "35%" },
            ].map((item) => (
              <li key={item.name} className="flex items-baseline justify-between gap-4 py-3.5">
                <span className="text-sm text-ink">{item.name}</span>
                <span className="shrink-0 text-sm font-medium text-ink-muted" data-numeric>
                  {item.share}
                  <span className="ml-1.5 text-2xs text-ink-subtle">of scanned homes</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card hoverEffect={false} className="flex flex-col justify-between gap-6 self-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <h3 className="eyebrow">Workspace Health</h3>
            </div>
            <p className="text-sm text-ink-muted">
              Your team generated <span className="font-medium text-ink">8 guides</span> this month, with a cumulative estimated valuation lift of{" "}
              <span className="font-medium text-ink" data-numeric>+$185,500</span>.
            </p>
          </div>
          <Button
            id="view-network-btn"
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = "/contractors"}
            className="w-full"
          >
            Contractor Network
          </Button>
        </Card>
      </section>

      {/* Share Report Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Pre-Listing Report"
        footer={
          <Button id="share-close-btn" variant="primary" onClick={() => setShareModalOpen(false)}>
            Close Window
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            Generate and copy a secure co-branded public URL for property sellers or buyers regarding: <strong className="text-ink">{selectedProperty}</strong>
          </p>
          <div className="flex items-center space-x-3 bg-surface-sunken border border-surface-border rounded-xl p-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              aria-label="Shareable report URL"
              className="flex-1 bg-transparent border-none text-xs text-ink focus:outline-none focus:ring-0"
            />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
