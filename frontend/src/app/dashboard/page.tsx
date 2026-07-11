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
    if (!prop.reportUrl) return;
    setShareUrl(`${window.location.origin}${prop.reportUrl}`);
    setSelectedProperty(prop.address);
    setShareModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-navy-800 rounded-2xl shadow-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-serif tracking-tight text-white">
            Welcome back, Mahesh
          </h1>
          <p className="text-navy-200 text-sm max-w-xl">
            Our computer vision model finished scanning your new uploads. Ready to inspect recommended improvements?
          </p>
        </div>
        <Button
          id="hero-analyze-btn"
          variant="primary"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={() => window.location.href = "/analyze"}
        >
          Analyze New Property
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} hoverEffect={false} className="p-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-ink-subtle uppercase tracking-widest">{stat.title}</span>
              <h3 className="text-3xl font-extrabold text-ink tracking-tight">{stat.value}</h3>
              <p className="text-[11px] text-ink-muted">{stat.desc}</p>
            </div>
          </Card>
        ))}
      </section>

      {/* Recent Analyses Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-ink">Recent Property Analyses</h2>
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
              <TableCell className="font-bold text-ink">{prop.address}</TableCell>
              <TableCell>{prop.date}</TableCell>
              <TableCell>
                <Badge variant={prop.status}>{prop.statusLabel}</Badge>
              </TableCell>
              <TableCell className="font-extrabold text-success">
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
                    disabled={!prop.reportUrl}
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

      {/* Trending Upgrades & Insights Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverEffect={false} className="p-6 space-y-4">
          <div className="flex items-center space-x-2 text-accent-600 font-bold">
            <TrendingUp className="w-5 h-5" />
            <h4 className="text-sm uppercase tracking-wider text-ink-muted">Trending Upgrades (Agents Only)</h4>
          </div>
          <p className="text-xs text-ink-muted leading-normal">
            Among local properties in the Austin MLS region, computer vision audits suggest prioritizing the following elements to secure higher buyer bidding premiums:
          </p>
          <ul className="space-y-3 text-xs">
            <li className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-xl p-3">
              <span className="text-ink font-semibold">Modern Kitchen Remodel</span>
              <span className="text-ink-muted font-bold">62% of scanned homes</span>
            </li>
            <li className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-xl p-3">
              <span className="text-ink font-semibold">HVAC Unit Replacement</span>
              <span className="text-ink-muted font-bold">48% of scanned homes</span>
            </li>
            <li className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-xl p-3">
              <span className="text-ink font-semibold">Exterior Painting & Siding Audit</span>
              <span className="text-ink-muted font-bold">35% of scanned homes</span>
            </li>
          </ul>
        </Card>

        <Card hoverEffect={false} className="p-6 space-y-4 justify-between flex flex-col">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-success font-bold">
              <CheckCircle className="w-5 h-5" />
              <h4 className="text-sm uppercase tracking-wider text-ink-muted">Workspace Health Indicator</h4>
            </div>
            <p className="text-xs text-ink-muted leading-normal">
              Your real estate team has generated <strong className="text-ink">8 comprehensive guides</strong> this month with a cumulative estimated valuation lift of <strong className="text-ink">+$185,500</strong>. Keep scanning listings to maximize contract conversions.
            </p>
          </div>
          <Button
            id="view-network-btn"
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = "/contractors"}
            className="w-full mt-4"
          >
            Manage Referrals & Contractor Network
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
