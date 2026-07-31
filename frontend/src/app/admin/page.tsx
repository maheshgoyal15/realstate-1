"use client";

import React, { useState } from "react";
import { Construction } from "lucide-react";
import { cn } from "@/lib/utils";

function ComingSoonNotice() {
  return (
    <div className="flex items-center gap-2 bg-warning-subtle border border-warning-border text-warning text-xs font-semibold px-4 py-3 rounded-xl">
      <Construction className="w-4 h-4 shrink-0" />
      <span>Team administration isn't built yet — the numbers and directory below are illustrative only, and this page isn't restricted to admins.</span>
    </div>
  );
}

export default function TeamAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("Analytics");

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-surface-border gap-4">
        <div>
          <h1 className="text-4xl">Enterprise Team Lead Administration</h1>
          <p className="text-ink-muted text-sm mt-1">Example tenant: Austin Premier Realty</p>
        </div>
        <div className="flex items-center space-x-3">
          {["Analytics", "Seat Allocation", "White-Label Branding"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                activeTab === tab
                  ? "bg-neutral-800 text-white"
                  : "bg-surface-raised border border-surface-border text-ink-muted hover:border-surface-border-strong"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <ComingSoonNotice />

      {activeTab === "Analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-surface p-6">
              <h3 className="text-sm font-medium text-ink-muted mb-1">Reports Generated (YTD)</h3>
              <p className="text-4xl font-semibold text-ink">412</p>
              <p className="text-xs text-success font-semibold mt-2">▲ 28% Month-over-Month</p>
            </div>
            <div className="card-surface p-6">
              <h3 className="text-sm font-medium text-ink-muted mb-1">Total Value Added</h3>
              <p className="text-4xl font-semibold text-accent-600">$14.2M</p>
              <p className="text-xs text-ink-subtle mt-2">Aggregated After Repair Value impact</p>
            </div>
            <div className="card-surface p-6">
              <h3 className="text-sm font-medium text-ink-muted mb-1">Contractor Dispatches</h3>
              <p className="text-4xl font-semibold text-ink">94</p>
              <p className="text-xs text-success font-semibold mt-2">22.8% Conversion Rate</p>
            </div>
            <div className="card-surface p-6">
              <h3 className="text-sm font-medium text-ink-muted mb-1">Listing Premium Securing</h3>
              <p className="text-4xl font-semibold text-success">+7.8%</p>
              <p className="text-xs text-ink-subtle mt-2">Above neighborhood baseline comps</p>
            </div>
          </div>

          <div className="card-surface p-8">
            <h2 className="text-xl font-semibold text-ink mb-4">Seat Utilization Audit Log</h2>
            <div className="divide-y divide-surface-border text-sm text-ink-muted">
              <div className="py-4 flex justify-between">
                <div><span className="font-semibold text-ink">Alice Vance</span> • alice@austinpremier.com</div>
                <div className="text-ink-muted">42 Analyses Completed YTD</div>
              </div>
              <div className="py-4 flex justify-between">
                <div><span className="font-semibold text-ink">Marcus Sterling</span> • marcus@austinpremier.com</div>
                <div className="text-ink-muted">38 Analyses Completed YTD</div>
              </div>
              <div className="py-4 flex justify-between">
                <div><span className="font-semibold text-ink">Priya Patel</span> • priya@austinpremier.com</div>
                <div className="text-ink-muted">19 Analyses Completed YTD</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Seat Allocation" && (
        <div className="max-w-2xl mx-auto card-surface p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-ink mb-2">Allocate New Agent Seat</h2>
            <p className="text-ink-muted text-sm">Securely dispatch an invitation token to provision an enterprise seat under your brokerage tenant.</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-2">Agent Email Address</label>
              <input
                type="email"
                disabled
                placeholder="newagent@austinpremier.com"
                className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-ink-muted opacity-60 cursor-not-allowed"
              />
            </div>
            <button disabled className="w-full bg-neutral-800 opacity-50 cursor-not-allowed text-white font-semibold py-4 rounded-xl">
              Dispatch Invitation Token
            </button>
          </div>
        </div>
      )}

      {activeTab === "White-Label Branding" && (
        <div className="max-w-2xl mx-auto card-surface p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-ink mb-2">Brokerage White-Label Customization</h2>
            <p className="text-ink-muted text-sm">Configure custom PDF report co-branding, custom terminology, and corporate color palettes.</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-2">Brokerage / Team Name</label>
              <input
                type="text"
                disabled
                value="Austin Premier Realty"
                readOnly
                className="w-full bg-surface-sunken border border-surface-border rounded-xl px-4 py-3 text-ink-muted opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-2">Brand Accent Color Hex</label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  disabled
                  value="#c05621"
                  className="w-14 h-14 bg-surface-sunken border border-surface-border rounded-xl opacity-60 cursor-not-allowed"
                />
                <span className="text-ink-muted font-mono text-base">#c05621</span>
              </div>
            </div>
            <button disabled className="w-full bg-success opacity-50 cursor-not-allowed text-white font-semibold py-4 rounded-xl">
              Commit Custom Branding Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
