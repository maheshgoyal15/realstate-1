"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Eye,
  Download,
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
      <Card className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/50 border-blue-500/20 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Welcome back, Mahesh! 👋
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
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
      </Card>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} hoverEffect={false} className="p-6 bg-slate-900/40 border-white/5 shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.title}</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</h3>
              <p className="text-[11px] text-slate-400">{stat.desc}</p>
            </div>
          </Card>
        ))}
      </section>

      {/* Recent Analyses Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-white">Recent Property Analyses</h2>
        {analyses.length === 0 ? (
          <Card className="p-8 text-center bg-slate-900/40 border-white/5">
            <p className="text-sm text-slate-400">
              No analyses yet. Upload your first property to get started.
            </p>
          </Card>
        ) : (
        <Table headers={["Property Address", "Date Created", "Analysis Status", "Calculated ROI", "Actions"]}>
          {analyses.map((prop) => (
            <TableRow key={prop.id} id={`row-${prop.id}`}>
              <TableCell className="font-bold text-white">{prop.address}</TableCell>
              <TableCell>{prop.date}</TableCell>
              <TableCell>
                <Badge variant={prop.status}>{prop.statusLabel}</Badge>
              </TableCell>
              <TableCell className="font-extrabold text-emerald-400">
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
                    onClick={() => handleDelete(prop.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
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
        <Card className="p-6 space-y-4 bg-slate-900/40 border-white/5 shadow-md">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold">
            <TrendingUp className="w-5 h-5" />
            <h4 className="text-sm uppercase tracking-wider text-slate-300">Trending Upgrades (Agents Only)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Among local properties in the Austin MLS region, computer vision audits suggest prioritizing the following elements to secure higher buyer bidding premiums:
          </p>
          <ul className="space-y-3 text-xs">
            <li className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-white font-semibold">• Modern Kitchen Remodel</span>
              <span className="text-slate-400 font-bold">62% of scanned homes</span>
            </li>
            <li className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-white font-semibold">• HVAC Unit Replacement</span>
              <span className="text-slate-400 font-bold">48% of scanned homes</span>
            </li>
            <li className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-white font-semibold">• Exterior Painting & Siding Audit</span>
              <span className="text-slate-400 font-bold">35% of scanned homes</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4 bg-slate-900/40 border-white/5 shadow-md justify-between flex flex-col">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle className="w-5 h-5" />
              <h4 className="text-sm uppercase tracking-wider text-slate-300">Workspace Health Indicator</h4>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Your real estate team has generated <strong>8 comprehensive guides</strong> this month with a cumulative estimated valuation lift of <strong>+$185,500</strong>. Keep scanning listings to maximize contract conversions.
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
          <p className="text-xs text-slate-400">
            Generate and copy a secure co-branded public URL for property sellers or buyers regarding: <strong>{selectedProperty}</strong>
          </p>
          <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent border-none text-xs text-indigo-300 focus:outline-none focus:ring-0"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
