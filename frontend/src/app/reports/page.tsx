"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  Eye,
  Download,
  Share2,
  Trash2,
  FileText,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
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
  status: "status-complete";
  reportUrl: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("date");

  // Selection for Share Modal
  const [shareReport, setShareReport] = useState<Report | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/reports");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setReports(data);
      } catch (error) {
        console.error("Failed to load reports:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (report: Report) => {
    if (!window.confirm(`Delete the report for ${report.address}? This can't be undone.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/v1/reports/${report.id}`, { method: "DELETE" });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== report.id));
        setNotification("Report deleted.");
      } else {
        setNotification("Failed to delete report. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete report:", error);
      setNotification("Failed to delete report. Please try again.");
    }
  };

  const handleDownload = (report: Report) => {
    window.open(report.reportUrl, "_blank");
  };

  const handleShareTrigger = (report: Report) => {
    const url = `${window.location.origin}/reports/${report.id}`;
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
      <div className="flex flex-col gap-6 border-b border-surface-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <span className="eyebrow">Library</span>
          <h1 className="text-4xl">My Reports</h1>
          <p className="text-ink-muted text-sm">
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
      <section className="card-surface p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field-inline pl-10 pr-4"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto justify-end">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            aria-label="Sort reports"
            className="select-field"
          >
            <option value="date">Newest Generated</option>
            <option value="address">Property Address</option>
          </select>
        </div>
      </section>

      {/* Reports Grid */}
      {processedReports.length === 0 ? (
        <Card hoverEffect={false} className="p-12 text-center">
          <p className="text-ink-muted text-sm font-semibold">No pre-listing reports generated yet.</p>
        </Card>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedReports.map((report) => (
            <article
              key={report.id}
              className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-accent-200 transition-[box-shadow,border-color] duration-200"
            >
              {/* Cover - no real property photos are stored yet, so this is an
                  icon placeholder rather than a fabricated stock photo */}
              <div
                onClick={() => window.location.href = `/reports/${report.id}`}
                className="h-44 w-full relative overflow-hidden bg-neutral-800 flex items-center justify-center cursor-pointer group"
              >
                <FileText className="w-10 h-10 text-neutral-500 group-hover:scale-110 transition-transform" />
                <Badge variant="status-complete" className="absolute top-3 left-3">Ready</Badge>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-sm font-semibold truncate">{report.address}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{report.title}</p>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Upgrade Investment:</span>
                    <span className="font-semibold text-ink">{formatCurrency(report.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Value Increase:</span>
                    <span className="font-semibold text-success">+{formatCurrency(report.valueAdd)}</span>
                  </div>
                  <div className="flex justify-between border-t border-surface-border pt-2 mt-2">
                    <span className="text-ink-muted">Recommendations:</span>
                    <span className="font-semibold text-ink">{report.recsCount} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Generated:</span>
                    <span className="text-ink-muted">{report.date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border">
                  <Button
                    id={`preview-btn-${report.id}`}
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => window.location.href = `/reports/${report.id}`}
                  >
                    View Report
                  </Button>
                  <Button
                    id={`dl-btn-${report.id}`}
                    variant="ghost"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownload(report)}
                  >
                    Download
                  </Button>
                  <Button
                    id={`share-btn-${report.id}`}
                    variant="ghost"
                    size="sm"
                    icon={<Share2 className="w-3.5 h-3.5" />}
                    onClick={() => handleShareTrigger(report)}
                  >
                    Share
                  </Button>
                  <Button
                    id={`delete-btn-${report.id}`}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => handleDelete(report)}
                    className="text-danger hover:bg-danger-subtle hover:text-danger"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
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
            <p className="text-xs text-ink-muted">
              Copy the secure co-branded public URL to email, text, or present directly:
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
                  setShareReport(null);
                  setNotification("Report shared link copied to clipboard.");
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-surface-raised border border-success-border text-success rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-medium">{notification}</div>
          <button onClick={() => setNotification(null)} aria-label="Dismiss notification" className="text-ink-subtle hover:text-ink font-mono">×</button>
        </div>
      )}
    </div>
  );
}
