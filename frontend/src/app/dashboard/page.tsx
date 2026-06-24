"use client";

import React, { useState } from "react";
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
  X,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

// Mock recent analyses matching specifications
const INITIAL_ANALYSES = [
  { id: "prop-1", address: "123 Oak St, Austin TX", date: "Dec 15, 2024", status: "status-complete" as const, statusLabel: "Complete", roi: "18.5%", cost: 24000 },
  { id: "prop-2", address: "456 Elm Ave, Austin TX", date: "Dec 13, 2024", status: "status-progress" as const, statusLabel: "Analyzing", roi: "22.0%", cost: 35000 },
  { id: "prop-3", address: "789 Pine Rd, Austin TX", date: "Dec 10, 2024", status: "status-complete" as const, statusLabel: "Complete", roi: "15.0%", cost: 12000 },
  { id: "prop-4", address: "1012 Maple Dr, Dallas TX", date: "Dec 05, 2024", status: "status-error" as const, statusLabel: "Error", roi: "--", cost: 0 },
];

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState(INITIAL_ANALYSES);
  const [activeNotification, setActiveNotification] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  
  // Quick stats matching specifications
  const stats = [
    { title: "Analyses", value: "12", trend: "↑ 14%", trendColor: "text-emerald-400", desc: "This month" },
    { title: "Avg ROI", value: "18.5%", trend: "↑ 2.4%", trendColor: "text-emerald-400", desc: "This month" },
    { title: "Reports", value: "8", trend: "→ Stable", trendColor: "text-slate-400", desc: "Generated" }
  ];

  const handleDelete = (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const handleShare = (address: string) => {
    const generatedUrl = `https://homeready.ai/share/report-${Math.random().toString(36).substr(2, 9)}`;
    setShareUrl(generatedUrl);
    setSelectedProperty(address);
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

      {/* Alert Banner for Unreviewed Items */}
      {activeNotification && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-amber-300 text-xs md:text-sm font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>You have 3 unreviewed recommendations from yesterday for <strong>123 Oak St, ATX</strong>.</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              id="view-unreviewed-btn"
              onClick={() => window.location.href = "/analyze/prop-1"}
              className="text-white hover:underline whitespace-nowrap"
            >
              View Now &gt;
            </button>
            <button 
              id="dismiss-unreviewed-btn"
              onClick={() => setActiveNotification(false)}
              className="text-slate-500 hover:text-slate-400 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} hoverEffect={false} className="p-6 flex justify-between items-center bg-slate-900/40 border-white/5 shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.title}</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</h3>
              <p className="text-[11px] text-slate-400">{stat.desc}</p>
            </div>
            <div className={`text-xs font-bold ${stat.trendColor} bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg`}>
              {stat.trend}
            </div>
          </Card>
        ))}
      </section>

      {/* Recent Analyses Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-white">Recent Property Analyses</h2>
        <Table headers={["Property Address", "Date Created", "Analysis Status", "Calculated ROI", "Actions"]}>
          {analyses.map((prop) => (
            <TableRow key={prop.id} id={`row-${prop.id}`}>
              <TableCell className="font-bold text-white">{prop.address}</TableCell>
              <TableCell>{prop.date}</TableCell>
              <TableCell>
                <Badge variant={prop.status}>{prop.statusLabel}</Badge>
              </TableCell>
              <TableCell className="font-extrabold text-emerald-400">{prop.roi}</TableCell>
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
                    onClick={() => handleShare(prop.address)}
                    disabled={prop.status !== "status-complete"}
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
