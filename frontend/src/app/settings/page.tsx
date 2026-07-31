"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle,
  AlertCircle,
  Construction,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiClient";

function PreviewOnlyNotice({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-warning-subtle border border-warning-border text-warning text-xs font-semibold px-4 py-3 rounded-xl">
      <Construction className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  // Branding State
  const [companyName, setCompanyName] = useState("");
  const [brandingColor, setBrandingColor] = useState("#0066CC");
  const [footerText, setFooterText] = useState("");
  const [savingBranding, setSavingBranding] = useState(false);

  // Notifications State
  const [completeAlerts, setCompleteAlerts] = useState(true);
  const [reportRequests, setReportRequests] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Properties State
  const [savedProperties, setSavedProperties] = useState<Array<{ id: string; address: string; style: string; budget: number }>>([]);
  const [newPropAddress, setNewPropAddress] = useState("");
  const [newPropStyle, setNewPropStyle] = useState("Modern");
  const [newPropBudget, setNewPropBudget] = useState("25000");
  const [addingProperty, setAddingProperty] = useState(false);

  // Team State
  const [teamMembers, setTeamMembers] = useState<Array<{ id?: string; name: string; email: string; role: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [invitingTeam, setInvitingTeam] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userRes, propRes, teamRes] = await Promise.all([
          apiFetch("/api/v1/users/me"),
          apiFetch("/api/v1/properties"),
          apiFetch("/api/v1/teams/members")
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setName(u.full_name || "");
          setEmail(u.email || "");
          setPhone(u.phone || "");
          const cfg = u.white_label_config || {};
          setCompanyName(cfg.company_name || "Austin Premier Realty");
          setBrandingColor(cfg.branding_color || "#0066CC");
          setFooterText(cfg.footer_text || "Prepared by Austin Premier Realty Group");
          setCompleteAlerts(cfg.analysis_complete_alerts ?? true);
          setReportRequests(cfg.new_report_requests ?? true);
        }

        if (propRes.ok) {
          const props = await propRes.json();
          setSavedProperties(props);
        }

        if (teamRes.ok) {
          const members = await teamRes.json();
          setTeamMembers(members);
        }
      } catch (e) {
        console.error("Failed to load settings from API:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Account Save Handler
  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      const payload: any = { full_name: name, phone };
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }
      const res = await apiFetch("/api/v1/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast("success", "Account details updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        showToast("error", err.detail || "Failed to update account.");
      }
    } catch (e: any) {
      showToast("error", "Error saving account details.");
    } finally {
      setSavingAccount(false);
    }
  };

  // Branding Save Handler
  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const res = await apiFetch("/api/v1/users/me/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          branding_color: brandingColor,
          footer_text: footerText
        })
      });
      if (res.ok) {
        showToast("success", "Agency branding updated. PDF reports will now reflect this branding.");
      } else {
        showToast("error", "Failed to update branding.");
      }
    } catch (e) {
      showToast("error", "Error updating agency branding.");
    } finally {
      setSavingBranding(false);
    }
  };

  // Notification Save Handler
  const handleSaveNotifications = async (newCompleteAlerts: boolean, newReportReqs: boolean) => {
    setCompleteAlerts(newCompleteAlerts);
    setReportRequests(newReportReqs);
    setSavingNotifications(true);
    try {
      const res = await apiFetch("/api/v1/users/me/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_complete_alerts: newCompleteAlerts,
          new_report_requests: newReportReqs
        })
      });
      if (res.ok) {
        showToast("success", "Notification preferences saved.");
      }
    } catch (e) {
      showToast("error", "Failed to save notifications.");
    } finally {
      setSavingNotifications(false);
    }
  };

  // Add Property Handler
  const handleAddProperty = async () => {
    if (!newPropAddress.trim()) return;
    setAddingProperty(true);
    try {
      const res = await apiFetch("/api/v1/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: newPropAddress,
          style_preference: newPropStyle,
          budget_ceiling: parseFloat(newPropBudget) || 25000
        })
      });
      if (res.ok) {
        const created = await res.json();
        setSavedProperties([created, ...savedProperties]);
        setNewPropAddress("");
        showToast("success", "Property saved successfully.");
      } else {
        showToast("error", "Failed to save property.");
      }
    } catch (e) {
      showToast("error", "Error saving property.");
    } finally {
      setAddingProperty(false);
    }
  };

  // Delete Property Handler
  const handleDeleteProperty = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/properties/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedProperties(savedProperties.filter((p) => p.id !== id));
        showToast("success", "Property removed.");
      }
    } catch (e) {
      showToast("error", "Failed to delete property.");
    }
  };

  // Team Invite Handler
  const handleInviteTeamMember = async () => {
    if (!inviteEmail.trim()) return;
    setInvitingTeam(true);
    try {
      const res = await apiFetch("/api/v1/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (res.ok) {
        const member = await res.json();
        setTeamMembers([...teamMembers, member]);
        setInviteEmail("");
        showToast("success", `Invitation sent to ${member.email}.`);
      } else {
        showToast("error", "Failed to send team invitation.");
      }
    } catch (e) {
      showToast("error", "Error inviting team member.");
    } finally {
      setInvitingTeam(false);
    }
  };

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
      <div className="space-y-3 border-b border-surface-border pb-8">
        <span className="eyebrow">Workspace</span>
        <h1 className="text-4xl">Settings</h1>
        <p className="text-ink-muted text-sm">Manage user accounts, agency branding, billing credentials, and workspace preferences.</p>
      </div>

      {statusMsg && (
        <div
          className={cn(
            "p-4 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200",
            statusMsg.type === "success"
              ? "bg-success-subtle0/10 border border-success-border text-success"
              : "bg-danger-subtle border border-danger-border text-danger"
          )}
        >
          {statusMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

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
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-medium uppercase tracking-wider text-left transition-colors",
                  isActive
                    ? "bg-neutral-800 text-white"
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
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-accent-600" />
                <span>My Account</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} id="acc-name" />
                  <Input label="Email Address" value={email} disabled id="acc-email" type="email" />
                  <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} id="acc-phone" />
                </div>

                <div className="pt-4 border-t border-surface-border space-y-4">
                  <h4 className="text-xs font-medium text-ink uppercase tracking-wider">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      id="acc-curr-pass"
                    />
                    <Input
                      label="New Password (min 12 chars)"
                      type="password"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      id="acc-new-pass"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end border-t border-surface-border">
                  <Button id="acc-save-btn" variant="primary" onClick={handleSaveAccount} disabled={savingAccount}>
                    {savingAccount ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "properties" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Home className="w-5 h-5 text-accent-600" />
                <span>Saved Properties</span>
              </h3>

              {/* Add Property Form */}
              <div className="bg-surface-sunken border border-surface-border rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-medium text-ink uppercase tracking-wider">Add New Property</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Address: 1042 Grandview Blvd"
                    value={newPropAddress}
                    onChange={(e) => setNewPropAddress(e.target.value)}
                    id="prop-addr-input"
                  />
                  <select
                    value={newPropStyle}
                    onChange={(e) => setNewPropStyle(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="Modern">Modern</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Farmhouse">Farmhouse</option>
                  </select>
                  <Input
                    placeholder="Budget: $25000"
                    value={newPropBudget}
                    onChange={(e) => setNewPropBudget(e.target.value)}
                    id="prop-budget-input"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleAddProperty} disabled={addingProperty}>
                    {addingProperty ? "Saving..." : "Add Property"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {savedProperties.length === 0 ? (
                  <p className="text-xs text-ink-subtle italic">No saved properties yet.</p>
                ) : (
                  savedProperties.map((p, idx) => (
                    <div key={p.id || idx} className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <p className="text-ink font-semibold">{p.address}</p>
                        <p className="text-ink-muted">Style: <strong className="text-ink capitalize">{p.style}</strong> • Budget: {formatCurrency(p.budget)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProperty(p.id)}
                        className="p-2 text-danger hover:text-danger-hover transition-colors"
                        aria-label="Delete property"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent-600" />
                <span>Billing & Subscription</span>
              </h3>
              <PreviewOnlyNotice message="Stripe payments integration (Category 2) is required to activate live billing transactions." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-sunken border border-surface-border rounded-2xl p-6 space-y-4">
                  <Badge variant="roi-high">Active Development Tier</Badge>
                  <h4 className="text-xl font-semibold text-ink">Pro SaaS Advisory Portal</h4>
                  <p className="text-2xl font-semibold text-accent-600">$0.00<span className="text-xs font-semibold text-ink-subtle"> / month (Dev Sandbox)</span></p>
                  <p className="text-xs text-ink-muted">Unlimited Computer Vision & PDF Report Generation</p>
                </div>

                <div className="bg-surface-sunken border border-surface-border rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs text-ink-muted">
                    <p className="font-semibold text-ink uppercase tracking-wider text-[10px]">Payment Method</p>
                    <p className="text-ink mt-1">Local Sandbox Environment</p>
                    <p>Status: Active</p>
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
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-600" />
                <span>Agency Branding (White-Label PDF Reports)</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Agency Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    id="brand-agency"
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest">Primary Brand Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandingColor}
                        onChange={(e) => setBrandingColor(e.target.value)}
                        className="w-10 h-10 bg-transparent border border-surface-border rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-mono text-ink-muted">{brandingColor}</span>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Input
                      label="Report Custom Footer text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      id="brand-footer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-border flex justify-end">
                  <Button id="brand-save-btn" variant="primary" onClick={handleSaveBranding} disabled={savingBranding}>
                    {savingBranding ? "Saving..." : "Save Branding"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent-600" />
                <span>Notifications</span>
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-surface-sunken border border-surface-border rounded-2xl cursor-pointer">
                  <div>
                    <h5 className="text-xs font-medium text-ink uppercase tracking-wider">Analysis complete alerts</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Send instant alert when computer vision scans complete</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={completeAlerts}
                    onChange={(e) => handleSaveNotifications(e.target.checked, reportRequests)}
                    className="accent-accent-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-surface-sunken border border-surface-border rounded-2xl cursor-pointer">
                  <div>
                    <h5 className="text-xs font-medium text-ink uppercase tracking-wider">New report requests</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Notify when broker shares new layout contexts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reportRequests}
                    onChange={(e) => handleSaveNotifications(completeAlerts, e.target.checked)}
                    className="accent-accent-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent-600" />
                <span>Security Settings</span>
              </h3>
              <PreviewOnlyNotice message="Two-Factor authentication and API key management require Category 2 authentication extensions." />
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4">
                  <div>
                    <h5 className="text-xs font-medium text-ink uppercase tracking-wider">Two-Factor Authentication</h5>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Add an extra layer of access verification security</p>
                  </div>
                  <Button id="sec-2fa-btn" variant="secondary" size="sm" disabled>
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4">
                  <div>
                    <h5 className="text-xs font-medium text-ink uppercase tracking-wider">API Authentication Keys</h5>
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
              <h3 className="text-lg font-semibold text-ink border-b border-surface-border pb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-600" />
                <span>Team Workspace</span>
              </h3>

              {/* Add member form */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Input
                    label="Member Email"
                    placeholder="Enter email: partner@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    id="team-email-input"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-1.5">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    aria-label="Role"
                    className="select-field w-full"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <Button id="team-invite-btn" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleInviteTeamMember} disabled={invitingTeam}>
                    {invitingTeam ? "Sending..." : "Invite"}
                  </Button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h5 className="text-xs font-medium text-ink-subtle uppercase tracking-widest">Active Workspace Members</h5>
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-ink-subtle italic">No team members invited yet.</p>
                ) : (
                  teamMembers.map((member, idx) => (
                    <div key={member.id || idx} className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-2xl p-4 text-xs font-semibold">
                      <div>
                        <p className="text-ink">{member.name}</p>
                        <p className="text-ink-subtle mt-0.5">{member.email}</p>
                      </div>
                      <Badge variant="time-quick">{member.role}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

        </section>
      </div>
    </div>
  );
}

