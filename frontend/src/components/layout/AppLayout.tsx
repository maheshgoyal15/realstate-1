"use client";

import React, { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  User,
  Sparkles,
  BarChart3,
  Home,
  Briefcase,
  Settings,
  LogOut,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Context properties that can be changed by sidebar
  const [activeProperty, setActiveProperty] = useState("123 Oak St, Austin TX");
  const [activeBudget, setActiveBudget] = useState(25000);
  const [isEditingContext, setIsEditingContext] = useState(false);

  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileDrawerRef, isMobileOpen);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Analyze New Property", href: "/analyze", icon: Sparkles },
    { name: "My Reports", href: "/reports", icon: BarChart3 },
    { name: "Contractor Network", href: "/contractors", icon: Briefcase },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // The login page renders its own full-screen layout with no app chrome.
  // This check runs after all hooks above so hook order stays constant across
  // client-side navigations (this layout persists across route changes).
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-surface-raised/90 backdrop-blur border-b border-surface-border h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left Logo / Burger */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-expanded={isMobileOpen}
            aria-haspopup="true"
            aria-label="Open navigation menu"
            className="md:hidden p-2.5 hover:bg-surface-sunken rounded-lg text-ink-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a href="/dashboard" className="flex items-center space-x-3 group">
            <div className="p-2 bg-navy-800 rounded-lg shadow-card group-hover:bg-navy-700 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold font-serif tracking-tight text-navy-800">
              HomeReady
            </span>
          </a>
        </div>

        {/* Center Global Search (Desktop) */}
        <div className="hidden md:flex items-center relative w-80">
          <Search className={cn("absolute left-3 w-4 h-4 transition-colors", {
            "text-accent-500": searchFocused,
            "text-ink-subtle": !searchFocused
          })} />
          <input
            type="text"
            placeholder="Search properties, reports, contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-sunken border border-surface-border-strong text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-0.5 hover:bg-surface-border rounded-md text-ink-subtle"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Mobile search toggle */}
          <button
            onClick={() => setIsMobileSearchOpen((v) => !v)}
            aria-expanded={isMobileSearchOpen}
            aria-label="Toggle search"
            className="md:hidden p-2.5 rounded-xl border border-surface-border bg-surface-sunken text-ink-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setHelpOpen(false);
                setProfileDropdownOpen(false);
              }}
              aria-expanded={notificationsOpen}
              aria-haspopup="true"
              aria-label="Notifications"
              className="p-2.5 rounded-xl border border-surface-border bg-surface-sunken text-ink-muted hover:text-ink relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-surface-border bg-surface-raised p-4 shadow-card-hover space-y-3 z-50">
                <div className="flex justify-between items-center border-b pb-2 border-surface-border">
                  <span className="font-bold text-xs uppercase tracking-wider text-ink-muted">Notifications</span>
                  <button onClick={() => setNotificationsOpen(false)} className="text-xs text-accent-600 hover:underline">Mark all read</button>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-3 p-1.5 rounded-lg hover:bg-surface-sunken">
                    <div className="w-2 h-2 mt-1.5 bg-accent-500 rounded-full flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-ink">Analysis complete: 123 Oak St</p>
                      <p className="text-ink-muted mt-0.5">8 rooms processed successfully.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-1.5 rounded-lg hover:bg-surface-sunken">
                    <div className="w-2 h-2 mt-1.5 bg-accent-500 rounded-full flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-ink">New Contractor Quote Request</p>
                      <p className="text-ink-muted mt-0.5">Remodeling Pro submitted a response.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Center icon */}
          <div className="relative">
            <button
              onClick={() => {
                setHelpOpen(!helpOpen);
                setNotificationsOpen(false);
                setProfileDropdownOpen(false);
              }}
              aria-expanded={helpOpen}
              aria-haspopup="true"
              aria-label="Help center"
              className="p-2.5 rounded-xl border border-surface-border bg-surface-sunken text-ink-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {helpOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-surface-border bg-surface-raised p-4 shadow-card-hover z-50">
                <h5 className="font-bold text-xs uppercase tracking-wider mb-2 border-b pb-2 border-surface-border text-ink-muted">Help Center</h5>
                <ul className="space-y-2 text-xs">
                  <li><a href="#" className="hover:text-accent-600 block py-1 text-ink">How AI value calculation works</a></li>
                  <li><a href="#" className="hover:text-accent-600 block py-1 text-ink">Best photo qualities for scan</a></li>
                  <li><a href="#" className="hover:text-accent-600 block py-1 text-ink">Contact platform support</a></li>
                </ul>
              </div>
            )}
          </div>

          {/* User profile avatar */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
                setHelpOpen(false);
              }}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
              aria-label="Account menu"
              className="flex items-center space-x-2 p-1.5 rounded-xl border border-transparent hover:border-surface-border hover:bg-surface-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <div className="w-7 h-7 bg-navy-700 rounded-full flex items-center justify-center font-bold text-white text-xs">
                MP
              </div>
              <ChevronDown className="w-4 h-4 text-ink-subtle" />
            </button>
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-surface-border bg-surface-raised p-2 shadow-card-hover z-50">
                <div className="px-4 py-3 border-b border-surface-border mb-1.5">
                  <p className="font-bold text-sm text-ink">Mahesh Patel</p>
                  <p className="text-xs text-ink-muted truncate">mahesh@example.com</p>
                </div>
                <a href="/settings" className="flex items-center space-x-2 px-4 py-2 text-xs hover:bg-surface-sunken rounded-lg transition-colors text-ink-muted hover:text-ink">
                  <User className="w-4 h-4 text-ink-subtle" />
                  <span>My Profile</span>
                </a>
                <button
                  onClick={() => {
                    // Force redirect logout
                    window.location.href = "/api/auth/signout";
                  }}
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-xs hover:bg-danger-subtle text-danger rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search row */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-b border-surface-border bg-surface-raised px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              type="text"
              autoFocus
              placeholder="Search properties, reports, contractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-surface-sunken border border-surface-border-strong text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex relative">
        {/* 2. SIDEBAR NAVIGATION (Desktop) */}
        <aside className="hidden md:flex flex-col w-72 border-r border-surface-border bg-surface-raised shrink-0 min-h-[calc(100vh-64px)] justify-between pb-6">
          <div className="space-y-6 pt-6">
            {/* Nav list */}
            <nav className="px-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors group",
                      isActive
                        ? "bg-navy-800 text-white shadow-card"
                        : "text-ink-muted hover:text-ink hover:bg-surface-sunken"
                    )}
                  >
                    <item.icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", {
                      "text-white": isActive,
                      "text-ink-subtle group-hover:text-ink": !isActive
                    })} />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="border-t border-surface-border mx-4" />

            {/* Context Widget: User Active Context */}
            <div className="px-6 space-y-4">
              <span className="block text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Active context</span>
              <div className="bg-surface-sunken border border-surface-border rounded-2xl p-4 space-y-3 relative group">
                {isEditingContext ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={activeProperty}
                      onChange={(e) => setActiveProperty(e.target.value)}
                      className="w-full text-xs bg-surface-raised border border-surface-border-strong rounded-lg p-2 text-ink focus:outline-none focus:border-accent-500"
                    />
                    <input
                      type="number"
                      value={activeBudget}
                      onChange={(e) => setActiveBudget(Number(e.target.value))}
                      className="w-full text-xs bg-surface-raised border border-surface-border-strong rounded-lg p-2 text-ink focus:outline-none focus:border-accent-500"
                    />
                    <button
                      onClick={() => setIsEditingContext(false)}
                      className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs py-1.5 rounded-lg transition-colors"
                    >
                      Save Context
                    </button>
                  </div>
                ) : (
                  <div>
                    <h6 className="text-xs font-bold text-ink truncate">{activeProperty}</h6>
                    <p className="text-[11px] text-ink-muted mt-1">Upgrade Budget: {formatCurrency(activeBudget)}</p>
                    <p className="text-[11px] text-accent-600 font-bold mt-1">Timeline: Quick wins first</p>
                    <button
                      onClick={() => setIsEditingContext(true)}
                      className="absolute top-3 right-3 text-[10px] text-ink-subtle hover:text-ink font-bold hidden group-hover:block transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Box */}
            <div className="px-6 space-y-3">
              <span className="block text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Workspace Stats</span>
              <div className="bg-surface-sunken border border-surface-border rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Analyses This Month</span>
                  <span className="font-bold text-ink">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Avg Recommendation ROI</span>
                  <span className="font-bold text-success">18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Reports Generated</span>
                  <span className="font-bold text-ink">4</span>
                </div>
              </div>
            </div>

            {/* Switch Workspace */}
            <div className="px-6 space-y-2">
              <span className="block text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Workspace</span>
              <div className="flex items-center justify-between text-xs font-semibold text-ink-muted bg-surface-sunken hover:bg-surface-border px-3 py-2 rounded-xl cursor-pointer transition-colors">
                <span>My Real Estate Team</span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-subtle" />
              </div>
            </div>
          </div>

          {/* Upgrade CTA Sticky Bottom */}
          <div className="px-6">
            <div className="bg-navy-800 rounded-2xl p-4 text-center space-y-3 shadow-card">
              <h6 className="text-xs font-bold text-white">Upgrade to Pro</h6>
              <p className="text-[10px] text-navy-200 leading-normal">Unlock white-label reports & batch analysis</p>
              <button
                onClick={() => window.location.href = "/settings?tab=billing"}
                className="w-full bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold py-2 rounded-xl transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </aside>

        {/* 3. MOBILE SIDEBAR DRAWER (Slides in) */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Overlay */}
            <div
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
            />

            {/* Drawer */}
            <aside
              ref={mobileDrawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              tabIndex={-1}
              className="w-72 max-w-[80vw] bg-surface-raised border-r border-surface-border relative z-10 flex flex-col justify-between py-6 focus:outline-none"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close navigation menu"
                className="absolute top-4 right-4 p-2 bg-surface-sunken hover:bg-surface-border rounded-full text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6 pt-8">
                <nav className="px-4 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-navy-800 text-white shadow-card"
                            : "text-ink-muted hover:text-ink hover:bg-surface-sunken"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Sticky bottom of drawer */}
              <div className="px-6">
                <div className="bg-navy-800 rounded-2xl p-4 text-center space-y-2">
                  <h6 className="text-xs font-bold text-white">Upgrade to Pro</h6>
                  <p className="text-[10px] text-navy-200">White-label reports & batch analysis</p>
                  <button className="w-full bg-accent-500 hover:bg-accent-600 text-white text-xs font-extrabold py-2 rounded-xl transition-colors">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* 4. MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 p-6 md:p-8 relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
