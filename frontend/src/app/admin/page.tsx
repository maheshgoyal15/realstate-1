"use client";

import React, { useState } from "react";

// Mandatory Secure Web Skills: Logging, Debugging & UI Interaction
// - MUST NOT print structured user objects or tokens using console.log/console.warn
// - Rely on framework-native modal components for secure, consistent UX

export default function TeamAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("Analytics");
  const [teamName, setTeamName] = useState("Austin Premier Realty");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail) return;
    setModalMessage(`Secure invitation link routed to ${newInviteEmail}. Seat allocated successfully.`);
    setNewInviteEmail("");
  };

  const handleWhiteLabelSave = (e: React.FormEvent) => {
    e.preventDefault();
    setModalMessage(`White-label configuration saved successfully for ${teamName}. Custom hex theme ${primaryColor} activated.`);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Enterprise Team Lead Administration</h1>
          <p className="text-slate-400 text-sm mt-1">Tenant: Austin Premier Realty • Active Seats: <span className="text-blue-400 font-semibold">12 / 15</span></p>
        </div>
        <div className="flex items-center space-x-3">
          {["Analytics", "Seat Allocation", "White-Label Branding"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Reports Generated (YTD)</h3>
              <p className="text-4xl font-extrabold text-white">412</p>
              <p className="text-xs text-emerald-400 font-semibold mt-2">▲ 28% Month-over-Month</p>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Total Value Added</h3>
              <p className="text-4xl font-extrabold text-blue-400">$14.2M</p>
              <p className="text-xs text-slate-500 mt-2">Aggregated After Repair Value impact</p>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Contractor Dispatches</h3>
              <p className="text-4xl font-extrabold text-white">94</p>
              <p className="text-xs text-emerald-400 font-semibold mt-2">22.8% Conversion Rate</p>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Listing Premium Securing</h3>
              <p className="text-4xl font-extrabold text-emerald-400">+7.8%</p>
              <p className="text-xs text-slate-500 mt-2">Above neighborhood baseline comps</p>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h2 className="text-xl font-bold text-white mb-4">Seat Utilization Audit Log</h2>
            <div className="divide-y divide-slate-800 text-sm text-slate-300">
              <div className="py-4 flex justify-between">
                <div><span className="font-semibold text-white">Alice Vance</span> • alice@austinpremier.com</div>
                <div className="text-slate-400">42 Analyses Completed YTD</div>
              </div>
              <div className="py-4 flex justify-between">
                <div><span className="font-semibold text-white">Marcus Sterling</span> • marcus@austinpremier.com</div>
                <div className="text-slate-400">38 Analyses Completed YTD</div>
              </div>
              <div className="py-4 flex justify-between">
                <div><span className="font-semibold text-white">Priya Patel</span> • priya@austinpremier.com</div>
                <div className="text-slate-400">19 Analyses Completed YTD</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Seat Allocation" && (
        <div className="max-w-2xl mx-auto glass-panel p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Allocate New Agent Seat</h2>
            <p className="text-slate-400 text-sm">Securely dispatch an invitation token to provision an enterprise seat under your brokerage tenant.</p>
          </div>
          <form onSubmit={handleInviteSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Agent Email Address</label>
              <input
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="newagent@austinpremier.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
            >
              Dispatch Invitation Token
            </button>
          </form>
        </div>
      )}

      {activeTab === "White-Label Branding" && (
        <div className="max-w-2xl mx-auto glass-panel p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Brokerage White-Label Customization</h2>
            <p className="text-slate-400 text-sm">Configure custom PDF report co-branding, custom terminology, and corporate color palettes.</p>
          </div>
          <form onSubmit={handleWhiteLabelSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Brokerage / Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Brand Accent Color Hex</label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer"
                />
                <span className="text-slate-300 font-mono text-base">{primaryColor}</span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
            >
              Commit Custom Branding Configuration
            </button>
          </form>
        </div>
      )}

      {/* Framework-Native Modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-3">Tenant Update Status</h3>
            <p className="text-slate-300 text-sm mb-6">{modalMessage}</p>
            <button
              onClick={() => setModalMessage(null)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors w-full"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
