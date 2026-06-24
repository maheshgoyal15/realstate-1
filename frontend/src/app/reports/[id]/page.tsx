"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Download, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  Printer, 
  Share2, 
  CheckCircle,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { formatCurrency } from "@/lib/utils";

export default function SecureReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "homeready2026") {
      setUnlocked(true);
      setToastMessage("Report decrypted successfully. Displaying pre-listing guideline ledger.");
    } else {
      setToastMessage("Invalid password. Decryption failed.");
    }
  };

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto py-20 animate-in fade-in duration-300">
        <Card hoverEffect={false} className="p-8 text-center bg-slate-900/60 border-white/10 shadow-2xl">
          <div className="mx-auto w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4">
            <LockIcon className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Secure Pre-Listing Report</h1>
          <p className="text-slate-400 text-xs leading-normal mb-6">
            This co-branded pre-listing guideline ledger is password protected by the issuing real estate brokerage.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter decryption password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-slate-100 placeholder:text-slate-650 focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold"
              />
              <p className="text-[10px] text-slate-500 mt-2">Hint: enter <span className="text-indigo-400 font-bold">homeready2026</span> for this preview</p>
            </div>
            <Button id="unlock-btn" variant="primary" type="submit" className="w-full py-3.5">
              Unlock Report
            </Button>
          </form>
        </Card>

        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-slate-900 border border-red-500/40 text-red-400 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="text-xs font-bold">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-mono">×</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Decrypted Report Header */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 bg-slate-900/60 rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Broker Verified Pre-Listing Guide</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Austin Premier Realty • Pre-Listing Advisor</h1>
          <p className="text-slate-400 text-xs">Property Context: <strong>123 Oak St, Austin TX</strong> • Token: {id}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            id="report-dl-pdf"
            variant="secondary" 
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => setToastMessage("Downloading secure co-branded PDF guide...")}
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
        
        {/* Left Side: Summary and stats */}
        <div className="lg:col-span-8 space-y-6">
          <Card hoverEffect={false} className="p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Executive Upgrade Summary</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Based on our computer vision analysis of 14 uploaded images and cross-referencing against 24 recently sold comparables in Austin (78704), executing the top recommended upgrades will transition this property from a baseline valuation of $785,000 to an After Repair Value (ARV) of $850,000.
            </p>

            {/* Comps List Table */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upgrade Ledger Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kitchen Remodel & Resurfacing</span>
                  <p className="text-xs text-slate-400">Replacing outdated laminates with quartz countertops and refacing cabinetry.</p>
                  <div className="flex justify-between items-center pt-3 text-xs border-t border-white/5 mt-3">
                    <span className="text-slate-400">Cost: $12,500</span>
                    <span className="text-emerald-400 font-bold">Projected Add: +$28,000</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-white/5 rounded-2xl p-5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hardwood Floor Refinishing</span>
                  <p className="text-xs text-slate-400">Professional sanding, staining, and sealing of original hardwoods.</p>
                  <div className="flex justify-between items-center pt-3 text-xs border-t border-white/5 mt-3">
                    <span className="text-slate-400">Cost: $4,500</span>
                    <span className="text-emerald-400 font-bold">Projected Add: +$12,500</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Ledger summary widgets */}
        <aside className="lg:col-span-4 space-y-6">
          <Card hoverEffect={false} className="p-6 space-y-4 bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Calculated ROI Summary</h3>
            
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Upgrades Investment:</span>
                <span className="font-extrabold text-white">$17,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Est. Valuation Lift:</span>
                <span className="font-extrabold text-emerald-400">+$40,500</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-3">
                <span className="text-slate-350">Overall ROI Premium:</span>
                <span className="font-extrabold text-emerald-400">+238%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button 
                id="contact-advising-broker"
                variant="primary" 
                className="w-full text-xs"
                onClick={() => setToastMessage("Consulting broker request routed. You will receive an email shortly.")}
              >
                Consult Advising Agent
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-bold">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-mono">×</button>
        </div>
      )}
    </div>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
