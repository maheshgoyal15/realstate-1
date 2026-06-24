"use client";

import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Share2, 
  Trash2, 
  FileText,
  Printer,
  Maximize,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

// Mock reports matching specifications
const INITIAL_REPORTS = [
  {
    id: "report-1",
    address: "123 Oak St, Austin TX",
    title: "Kitchen Remodel + Spa Bathroom Assessment",
    recsCount: 8,
    valueAdd: 92550,
    cost: 143000,
    date: "Dec 15, 2024",
    status: "status-complete" as const,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "report-2",
    address: "456 Elm Ave, Austin TX",
    title: "Hardwood Refinishing & Landscaping Audit",
    recsCount: 3,
    valueAdd: 42000,
    cost: 21500,
    date: "Dec 13, 2024",
    status: "status-complete" as const,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "report-3",
    address: "789 Pine Rd, Austin TX",
    title: "Complete Pre-Listing Valuation Uplift Strategy",
    recsCount: 12,
    valueAdd: 185000,
    cost: 110000,
    date: "Dec 10, 2024",
    status: "status-complete" as const,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
  }
];

export default function ReportsPage() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("date");

  // Selection for Preview Modal
  const [previewReport, setPreviewReport] = useState<typeof INITIAL_REPORTS[0] | null>(null);
  
  // Selection for Share Modal
  const [shareReport, setShareReport] = useState<typeof INITIAL_REPORTS[0] | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleShareTrigger = (report: typeof INITIAL_REPORTS[0]) => {
    const url = `https://homeready.ai/reports/shared-${report.id}`;
    setShareUrl(url);
    setShareReport(report);
  };

  // Filter & Sort
  const processedReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery.trim()) {
      result = result.filter(r => 
        r.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortField === "address") {
      result.sort((a, b) => a.address.localeCompare(b.address));
    } else {
      // Date order (newest first)
      result.sort((a, b) => b.date.localeCompare(a.date));
    }

    return result;
  }, [reports, searchQuery, sortField]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Access and manage your generated co-branded pre-listing upgrade recommendations.
          </p>
        </div>
        <Button 
          id="reports-new-analysis-btn"
          variant="primary" 
          icon={<Sparkles className="w-4 h-4" />}
          onClick={() => window.location.href = "/analyze"}
        >
          Generate Report
        </Button>
      </div>

      {/* Filter Toolbar */}
      <section className="glass-card p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-white/5 bg-slate-900/30">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto justify-end">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="date">Newest Generated</option>
            <option value="address">Property Address</option>
          </select>
        </div>
      </section>

      {/* Reports Grid */}
      {processedReports.length === 0 ? (
        <Card hoverEffect={false} className="p-12 text-center border-white/5 bg-slate-900/20">
          <p className="text-slate-400 text-sm font-semibold">No pre-listing reports generated yet.</p>
        </Card>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedReports.map((report) => (
            <article 
              key={report.id}
              className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:border-slate-700 hover:scale-[1.01] transition-all duration-200"
            >
              {/* Cover Image */}
              <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                <img src={report.image} alt={report.address} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />
                <Badge variant="status-complete" className="absolute top-3 left-3">Ready</Badge>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-sm font-extrabold truncate">{report.address}</h4>
                  <p className="text-[10px] text-slate-350 truncate">{report.title}</p>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Upgrade Investment:</span>
                    <span className="font-bold text-white">{formatCurrency(report.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Value Increase:</span>
                    <span className="font-bold text-emerald-400">+{formatCurrency(report.valueAdd)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                    <span className="text-slate-400">Recommendations:</span>
                    <span className="font-bold text-white">{report.recsCount} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Generated:</span>
                    <span className="text-slate-400">{report.date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <Button 
                    id={`preview-btn-${report.id}`}
                    variant="ghost" 
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewReport(report)}
                  >
                    Preview
                  </Button>
                  <Button 
                    id={`dl-btn-${report.id}`}
                    variant="ghost" 
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => setNotification("Official report PDF downloaded to your files.")}
                  >
                    Download
                  </Button>
                  <Button 
                    id={`share-btn-${report.id}`}
                    variant="ghost" 
                    size="sm"
                    icon={<Share2 className="w-3.5 h-3.5" />}
                    className="col-span-2"
                    onClick={() => handleShareTrigger(report)}
                  >
                    Share Co-branded Link
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* 3.6 REPORT PREVIEW MODAL */}
      {previewReport && (
        <Modal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={`Secure Preview: ${previewReport.address}`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-slate-500">Page 1 of 2</span>
              <div className="flex items-center space-x-3">
                <Button id="preview-print-btn" variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />}>Print</Button>
                <Button id="preview-dl-btn" variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => { setPreviewReport(null); setNotification("Download completed."); }}>Download PDF</Button>
                <Button id="preview-close-btn" variant="primary" size="sm" onClick={() => setPreviewReport(null)}>Close Viewer</Button>
              </div>
            </div>
          }
        >
          {/* Simulated PDF document */}
          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-inner border border-slate-200 space-y-8 font-sans max-h-[60vh] overflow-y-auto">
            <div className="text-center border-b pb-6 border-slate-200">
              <h2 className="text-2xl font-extrabold tracking-tight text-blue-600">HOMEREADY AI REPORT</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Pre-Listing Value Uplift Guide</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">Prepared For:</p>
                <p className="font-bold text-slate-800">Mahesh Patel</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-bold uppercase">Date Generated:</p>
                <p className="font-bold text-slate-800">{previewReport.date}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Executive Summary</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Based on computer vision audits of interior and exterior photos of <strong>{previewReport.address}</strong>, we have generated {previewReport.recsCount} remodeling projects optimized for high-ROI comps conversion in the neighborhood area. Implementing these upgrades adds significant market interest.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Valuation Ledger</h4>
              <div className="grid grid-cols-3 gap-4 border rounded-xl p-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Upgrade cost</p>
                  <p className="text-base font-extrabold text-slate-800 mt-1">{formatCurrency(previewReport.cost)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Value increase</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-1">+{formatCurrency(previewReport.valueAdd)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Overall ROI</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-1">
                    +{Math.round((previewReport.valueAdd / previewReport.cost) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 text-center border-t border-slate-200">
              <p className="text-[10px] text-slate-400 font-bold">© 2026 HomeReady AI Platform • Confidential & Proprietary</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Share Link Modal */}
      {shareReport && (
        <Modal
          isOpen={!!shareReport}
          onClose={() => setShareReport(null)}
          title="Share Report Link"
          footer={
            <Button id="share-close-btn" variant="primary" onClick={() => setShareReport(null)}>
              Close Window
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Copy the secure co-branded public URL to email, text, or present directly:
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
                  setShareReport(null);
                  setNotification("Report shared link copied to clipboard.");
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-bold">{notification}</div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-mono">×</button>
        </div>
      )}
    </div>
  );
}
