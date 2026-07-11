"use client";

import React, { useState } from "react";
import {
  User,
  Home,
  CreditCard,
  Award,
  Bell,
  Lock,
  Users,
  Trash2,
  Plus,
  Construction,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";

// None of the tabs on this page are backed by a real API yet (no account,
// billing, branding, team, or security endpoints exist on the backend). Rather
// than let inputs silently "save" with a fake toast, every control here is
// disabled and clearly labeled so nothing pretends to work.
function ComingSoonNotice() {
  return (
    <div className="flex items-center gap-2 bg-warning-subtle border border-warning-border text-warning text-xs font-semibold px-4 py-3 rounded-xl">
      <Construction className="w-4 h-4 shrink-0" />
      <span>This section is a preview — it's not connected to your account yet, so changes here won't be saved.</span>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  // Illustrative example data only (see ComingSoonNotice) — not the real signed-in user.
  const [name] = useState("Jordan Rivera");
  const [email] = useState("jordan@example.com");
  const [phone] = useState("+1 (512) 555-0123");

  const [companyName] = useState("Austin Premier Realty");
  const [brandingColor] = useState("#0066CC");
  const [footerText] = useState("Prepared by Austin Premier Realty Group");

  const [teamMembers] = useState([
    { name: "Devin K.", email: "devin@example.com", role: "Editor" },
    { name: "Sarah M.", email: "sarah@example.com", role: "Viewer" }
  ]);

  const [savedProperties] = useState([
    { address: "2030 Natchez Dr, Austin TX", style: "Modern", budget: 24000 },
    { address: "456 Elm Ave, Austin TX", style: "Traditional", budget: 35000 }
  ]);

  const tabs = [
    { id: "account", label: "My Account", icon: User },
    { id: "properties", label: "Properties", icon: Home },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "branding", label: "Branding", icon: Award },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "team", label: "Team Space", icon: Users },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-serif text-ink tracking-tight">Settings</h1>
        <p className="text-ink-muted text-sm">Manage user accounts, agency branding, billing credentials, and workspace preferences.</p>
      </div>

      {/* Two-Column Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 bg-surface-raised border border-surface-border rounded-2xl p-3 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-colors",
                  isActive
                    ? "bg-navy-800 text-white shadow-card"
                    : "text-ink-muted hover:text-ink hover:bg-surface-sunken"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <section className="lg:col-span-9">

          {activeTab === "account" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-accent-600" />
                <span>My Account</span>
              </h3>
              <ComingSoonNotice />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={name} disabled id="acc-name" />
                  <Input label="Email Address" value={email} disabled id="acc-email" type="email" />
                  <Input label="Phone Number" value={phone} disabled id="acc-phone" />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-surface-border">
                  <span className="text-xs text-ink-subtle font-bold">Change Password (Coming Soon)</span>
                  <Button id="acc-save-btn" variant="primary" disabled>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "properties" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Home className="w-5 h-5 text-accent-600" />
                <span>Saved Properties</span>
              </h3>
              <ComingSoonNotice />
              <div className="space-y-3">
                {savedProperties.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <p className="text-ink">{p.address}</p>
                      <p className="text-ink-muted">Style: <strong className="text-ink capitalize">{p.style}</strong> • Budget: {formatCurrency(p.budget)}</p>
                    </div>
                    <button
                      disabled
                      className="p-2 text-ink-subtle opacity-50 cursor-not-allowed"
                      aria-label="Delete property (coming soon)"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent-600" />
                <span>Billing & Subscription</span>
              </h3>
              <ComingSoonNotice />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-sunken border border-surface-border rounded-2xl p-6 space-y-4">
                  <Badge variant="roi-high">Example Plan</Badge>
                  <h4 className="text-xl font-extrabold text-ink">Pro SaaS Portal</h4>
                  <p className="text-2xl font-extrabold text-accent-600">$19.99<span className="text-xs font-semibold text-ink-subtle"> / month</span></p>
                  <p className="text-xs text-ink-muted">Next billing transaction: Jan 15, 2025</p>
                  <button disabled className="text-xs text-danger opacity-50 cursor-not-allowed hover:no-underline font-bold block pt-2">
                    Cancel Subscription
                  </button>
                </div>

                <div className="bg-surface-sunken border border-surface-border rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs text-ink-muted">
                    <p className="font-bold text-ink uppercase tracking-wider text-[10px]">Payment Method</p>
                    <p className="text-ink mt-1">Mastercard ending in <strong>4590</strong></p>
                    <p>Expiration: 12/28</p>
                  </div>
                  <Button id="billing-history-btn" variant="secondary" size="sm" disabled>
                    View Billing History
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "branding" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-600" />
                <span>Agency Branding (Agents Only)</span>
              </h3>
              <ComingSoonNotice />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Agency Name" value={companyName} disabled id="brand-agency" />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest">Primary Brand Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandingColor}
                        disabled
                        className="w-10 h-10 bg-transparent border border-surface-border rounded-lg opacity-50 cursor-not-allowed"
                      />
                      <span className="text-xs font-mono text-ink-muted">{brandingColor}</span>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Input label="Report Custom Footer text" value={footerText} disabled id="brand-footer" />
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-border flex justify-end">
                  <Button id="brand-save-btn" variant="primary" disabled>Save Branding</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent-600" />
                <span>Notifications</span>
              </h3>
              <ComingSoonNotice />
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-surface-sunken border border-surface-border rounded-2xl opacity-60">
                  <div>
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider">Analysis complete alerts</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Send instant email when computer vision scans complete</p>
                  </div>
                  <input type="checkbox" defaultChecked disabled className="accent-accent-500" />
                </label>

                <label className="flex items-center justify-between p-4 bg-surface-sunken border border-surface-border rounded-2xl opacity-60">
                  <div>
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider">New report requests</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Notify when broker shares new layout contexts</p>
                  </div>
                  <input type="checkbox" defaultChecked disabled className="accent-accent-500" />
                </label>
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent-600" />
                <span>Security Settings</span>
              </h3>
              <ComingSoonNotice />
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4">
                  <div>
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider">Two-Factor Authentication</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Add an extra layer of access verification security</p>
                  </div>
                  <Button id="sec-2fa-btn" variant="secondary" size="sm" disabled>
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4">
                  <div>
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider">API Authentication Keys</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Integration keys for co-brokerage CRM matching</p>
                  </div>
                  <Button id="sec-api-btn" variant="secondary" size="sm" disabled>
                    Create API Key
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "team" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-600" />
                <span>Team Workspace</span>
              </h3>
              <ComingSoonNotice />

              {/* Add member form (disabled preview) */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input placeholder="Enter email: partner@agency.com" disabled id="team-email-input" />
                </div>
                <div className="w-32 mt-6">
                  <select
                    disabled
                    defaultValue="Viewer"
                    aria-label="Role"
                    className="w-full bg-surface-sunken border border-surface-border rounded-xl px-3 py-3 text-xs text-ink-muted opacity-60 cursor-not-allowed"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="mt-6 flex items-end">
                  <Button id="team-invite-btn" variant="primary" icon={<Plus className="w-4 h-4" />} disabled>Invite</Button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h5 className="text-xs font-bold text-ink-subtle uppercase tracking-widest">Active Workspace Members</h5>
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4 text-xs font-semibold">
                    <div>
                      <p className="text-ink">{member.name}</p>
                      <p className="text-ink-subtle mt-0.5">{member.email}</p>
                    </div>
                    <Badge variant="time-quick">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </section>
      </div>
    </div>
  );
}
