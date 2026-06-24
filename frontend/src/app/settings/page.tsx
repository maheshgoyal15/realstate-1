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
  Upload, 
  Check, 
  Trash2, 
  ShieldCheck,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  // Account details
  const [name, setName] = useState("Mahesh Patel");
  const [email, setEmail] = useState("mahesh@example.com");
  const [phone, setPhone] = useState("+1 (512) 555-0123");

  // White label branding details
  const [companyName, setCompanyName] = useState("Austin Premier Realty");
  const [brandingColor, setBrandingColor] = useState("#0066CC");
  const [footerText, setFooterText] = useState("Prepared by Austin Premier Realty Group");

  // Team list
  const [teamMembers, setTeamMembers] = useState([
    { name: "Devin K.", email: "devin@example.com", role: "Editor" },
    { name: "Sarah M.", email: "sarah@example.com", role: "Viewer" }
  ]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Viewer");

  // Saved Properties list
  const [savedProperties, setSavedProperties] = useState([
    { address: "2030 Natchez Dr, Austin TX", style: "Modern", budget: 24000 },
    { address: "456 Elm Ave, Austin TX", style: "Traditional", budget: 35000 }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage("Account modifications saved successfully.");
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage("White-label agency assets synchronized.");
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberEmail.trim()) {
      setTeamMembers(prev => [...prev, { name: newMemberEmail.split("@")[0], email: newMemberEmail, role: newMemberRole }]);
      setNewMemberEmail("");
      setToastMessage("Team member invitation sent.");
    }
  };

  const handleDeleteProperty = (address: string) => {
    setSavedProperties(prev => prev.filter(p => p.address !== address));
    setToastMessage("Saved property profile deleted.");
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
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 text-sm">Manage user accounts, agency branding, billing credentials, and workspace preferences.</p>
      </div>

      {/* Two-Column Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 bg-slate-900/40 border border-white/10 rounded-2xl p-3 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
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
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                <span>My Account</span>
              </h3>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    id="acc-name"
                  />
                  <Input 
                    label="Email Address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    id="acc-email"
                    type="email"
                  />
                  <Input 
                    label="Phone Number" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    id="acc-phone"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setToastMessage("Password verification link sent to email.")}
                    className="text-xs text-indigo-400 hover:underline font-bold"
                  >
                    Change Password
                  </button>
                  <Button id="acc-save-btn" variant="primary" type="submit">Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === "properties" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-400" />
                <span>Saved Properties</span>
              </h3>
              <div className="space-y-3">
                {savedProperties.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <p className="text-white">{p.address}</p>
                      <p className="text-slate-400">Style: <strong className="text-white capitalize">{p.style}</strong> • Budget: {formatCurrency(p.budget)}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteProperty(p.address)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      aria-label="Delete property"
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
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>Billing & Subscription</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 space-y-4">
                  <Badge variant="roi-high">Active Plan</Badge>
                  <h4 className="text-xl font-extrabold text-white">Pro SaaS Portal</h4>
                  <p className="text-2xl font-extrabold text-indigo-400">$19.99<span className="text-xs font-semibold text-slate-500"> / month</span></p>
                  <p className="text-xs text-slate-400">Next billing transaction: Jan 15, 2025</p>
                  <button 
                    onClick={() => setToastMessage("Billing subscription cancelled.")}
                    className="text-xs text-red-400 hover:underline font-bold block pt-2"
                  >
                    Cancel Subscription
                  </button>
                </div>

                <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <p className="font-bold text-white uppercase tracking-wider text-[10px]">Payment Method</p>
                    <p className="text-white mt-1">💳 Mastercard ending in <strong>4590</strong></p>
                    <p>Expiration: 12/28</p>
                  </div>
                  <Button 
                    id="billing-history-btn"
                    variant="secondary" 
                    size="sm"
                    onClick={() => setToastMessage("Displaying billing ledger history...")}
                  >
                    View Billing History
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "branding" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Agency Branding (Agents Only)</span>
              </h3>
              <form onSubmit={handleSaveBranding} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Agency Name" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    id="brand-agency"
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">Primary Brand Color</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="color" 
                        value={brandingColor} 
                        onChange={(e) => setBrandingColor(e.target.value)}
                        className="w-10 h-10 bg-transparent border border-white/10 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400">{brandingColor}</span>
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

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <Button id="brand-save-btn" variant="primary" type="submit">Save Branding</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span>Notifications</span>
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl cursor-pointer">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Analysis complete alerts</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Send instant email when computer vision scans complete</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-blue-500" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl cursor-pointer">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">New report requests</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Notify when broker shares new layout contexts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-blue-500" />
                </label>
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                <span>Security Settings</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950 border border-white/5 rounded-2xl p-4">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Two-Factor Authentication</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Add an extra layer of access verification security</p>
                  </div>
                  <Button 
                    id="sec-2fa-btn"
                    variant="secondary" 
                    size="sm"
                    onClick={() => setToastMessage("Two-factor auth wizard loaded.")}
                  >
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex justify-between items-center bg-slate-950 border border-white/5 rounded-2xl p-4">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">API Authentication Keys</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Integration keys for co-brokerage CRM matching</p>
                  </div>
                  <Button 
                    id="sec-api-btn"
                    variant="secondary" 
                    size="sm"
                    onClick={() => setToastMessage("Generated new active API developer key.")}
                  >
                    Create API Key
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "team" && (
            <Card hoverEffect={false} className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Team Workspace</span>
              </h3>
              
              {/* Add member form */}
              <form onSubmit={handleAddTeamMember} className="flex gap-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Enter email: partner@agency.com" 
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    id="team-email-input"
                  />
                </div>
                <div className="w-32 mt-6">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="mt-6 flex items-end">
                  <Button id="team-invite-btn" variant="primary" type="submit" icon={<Plus className="w-4 h-4" />}>Invite</Button>
                </div>
              </form>

              {/* Members List */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Workspace Members</h5>
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-semibold">
                    <div>
                      <p className="text-white">{member.name}</p>
                      <p className="text-slate-500 mt-0.5">{member.email}</p>
                    </div>
                    <Badge variant="time-quick">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </section>
      </div>

      {/* Toast Notification element */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-bold">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-mono">×</button>
        </div>
      )}
    </div>
  );
}
