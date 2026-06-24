"use client";

import React, { useState, useEffect } from "react";
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
  TrendingUp, 
  BarChart3, 
  Home, 
  Briefcase, 
  Settings, 
  Plus, 
  LogOut, 
  Sun, 
  Moon,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Context properties that can be changed by sidebar
  const [activeProperty, setActiveProperty] = useState("123 Oak St, Austin TX");
  const [activeBudget, setActiveBudget] = useState(25000);
  const [isEditingContext, setIsEditingContext] = useState(false);

  // Toggle Theme helper
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Synchronize initial theme
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Analyze New Property", href: "/analyze", icon: Sparkles },
    { name: "My Reports", href: "/reports", icon: BarChart3 },
    { name: "Contractor Network", href: "/contractors", icon: Briefcase },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-200", {
      "bg-slate-950 text-slate-50": theme === "dark",
      "bg-slate-50 text-slate-900": theme === "light"
    })}>
      {/* 1. TOP NAVIGATION BAR */}
      <header className={cn("glass-nav h-16 px-6 flex items-center justify-between sticky top-0 z-40 border-b", {
        "border-white/10 bg-slate-950/75": theme === "dark",
        "border-slate-200 bg-white/75": theme === "light"
      })}>
        {/* Left Logo / Burger */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <a href="/dashboard" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-md group-hover:shadow-indigo-500/50 transition-all">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className={cn("text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent", {
              "from-blue-600 to-indigo-600 bg-none text-blue-600": theme === "light"
            })}>
              HomeReady
            </span>
          </a>
        </div>

        {/* Center Global Search (Desktop) */}
        <div className="hidden md:flex items-center relative w-80">
          <Search className={cn("absolute left-3 w-4 h-4 transition-colors", {
            "text-indigo-400": searchFocused,
            "text-slate-500": !searchFocused
          })} />
          <input
            type="text"
            placeholder="Search properties, reports, contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn("w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all", {
              "bg-slate-200/50 text-slate-900 border-slate-350": theme === "light"
            })}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 p-0.5 hover:bg-white/10 rounded-md text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className={cn("p-2 rounded-xl border transition-all", {
              "bg-white/5 border-white/10 text-slate-300 hover:text-white": theme === "dark",
              "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200": theme === "light"
            })}
            aria-label="Toggle visual theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setHelpOpen(false);
                setProfileDropdownOpen(false);
              }}
              className={cn("p-2 rounded-xl border relative transition-all", {
                "bg-white/5 border-white/10 text-slate-300 hover:text-white": theme === "dark",
                "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200": theme === "light"
              })}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {notificationsOpen && (
              <div className={cn("absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-2xl space-y-3 z-50", {
                "bg-slate-900 border-white/10 text-slate-300": theme === "dark",
                "bg-white border-slate-200 text-slate-800": theme === "light"
              })}>
                <div className="flex justify-between items-center border-b pb-2 border-white/10">
                  <span className="font-bold text-xs uppercase tracking-wider">Notifications</span>
                  <button onClick={() => setNotificationsOpen(false)} className="text-xs text-blue-400 hover:underline">Mark all read</button>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-3 p-1.5 rounded-lg hover:bg-white/5">
                    <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Analysis complete: 123 Oak St</p>
                      <p className="text-slate-400 mt-0.5">8 rooms processed successfully.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-1.5 rounded-lg hover:bg-white/5">
                    <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">New Contractor Quote Request</p>
                      <p className="text-slate-400 mt-0.5">Remodeling Pro submitted a response.</p>
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
              className={cn("p-2 rounded-xl border transition-all", {
                "bg-white/5 border-white/10 text-slate-300 hover:text-white": theme === "dark",
                "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200": theme === "light"
              })}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {helpOpen && (
              <div className={cn("absolute right-0 mt-2 w-64 rounded-2xl border p-4 shadow-2xl z-50", {
                "bg-slate-900 border-white/10 text-slate-300": theme === "dark",
                "bg-white border-slate-200 text-slate-800": theme === "light"
              })}>
                <h5 className="font-bold text-xs uppercase tracking-wider mb-2 border-b pb-2 border-white/10">Help Center</h5>
                <ul className="space-y-2 text-xs">
                  <li><a href="#" className="hover:text-white block py-1">How AI value calculation works</a></li>
                  <li><a href="#" className="hover:text-white block py-1">Best photo qualities for scan</a></li>
                  <li><a href="#" className="hover:text-white block py-1">Contact platform support</a></li>
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
              className="flex items-center space-x-2 p-1.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
            >
              <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xs">
                MP
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {profileDropdownOpen && (
              <div className={cn("absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50", {
                "bg-slate-900 border-white/10 text-slate-300": theme === "dark",
                "bg-white border-slate-200 text-slate-800": theme === "light"
              })}>
                <div className="px-4 py-3 border-b border-white/10 mb-1.5">
                  <p className="font-bold text-sm text-white">Mahesh Patel</p>
                  <p className="text-xs text-slate-400 truncate">mahesh@example.com</p>
                </div>
                <a href="/settings" className="flex items-center space-x-2 px-4 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors text-slate-300 hover:text-white">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </a>
                <button 
                  onClick={() => {
                    // Force redirect logout
                    window.location.href = "/api/auth/signout";
                  }}
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-xs hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* 2. SIDEBAR NAVIGATION (Desktop) */}
        <aside className={cn("hidden md:flex flex-col w-72 border-r shrink-0 min-h-[calc(100vh-64px)] justify-between pb-6", {
          "border-white/10 bg-slate-900/35": theme === "dark",
          "border-slate-200 bg-slate-50": theme === "light"
        })}>
          <div className="space-y-6 pt-6">
            {/* Nav list */}
            <nav className="px-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", {
                      "text-white": isActive,
                      "text-slate-400 group-hover:text-slate-200": !isActive
                    })} />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="border-t border-white/10 mx-4" />

            {/* Context Widget: User Active Context */}
            <div className="px-6 space-y-4">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active context</span>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 relative group">
                {isEditingContext ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={activeProperty}
                      onChange={(e) => setActiveProperty(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      value={activeBudget}
                      onChange={(e) => setActiveBudget(Number(e.target.value))}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    />
                    <button
                      onClick={() => setIsEditingContext(false)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-1.5 rounded-lg transition-colors"
                    >
                      Save Context
                    </button>
                  </div>
                ) : (
                  <div>
                    <h6 className="text-xs font-bold text-white truncate">{activeProperty}</h6>
                    <p className="text-[11px] text-slate-400 mt-1">Upgrade Budget: {formatCurrency(activeBudget)}</p>
                    <p className="text-[11px] text-indigo-400 font-bold mt-1">Timeline: Quick wins first</p>
                    <button
                      onClick={() => setIsEditingContext(true)}
                      className="absolute top-3 right-3 text-[10px] text-slate-500 hover:text-white font-bold hidden group-hover:block transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Box */}
            <div className="px-6 space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace Stats</span>
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Analyses This Month</span>
                  <span className="font-bold text-white">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Recommendation ROI</span>
                  <span className="font-bold text-emerald-400">18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reports Generated</span>
                  <span className="font-bold text-white">4</span>
                </div>
              </div>
            </div>

            {/* Switch Workspace */}
            <div className="px-6 space-y-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-slate-500">Workspace</span>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-350 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl cursor-pointer">
                <span>🏢 My Real Estate Team</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Upgrade CTA Sticky Bottom */}
          <div className="px-6">
            <div className="bg-gradient-to-tr from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-4 text-center space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
              <h6 className="text-xs font-bold text-white relative z-10">Upgrade to Pro</h6>
              <p className="text-[10px] text-slate-350 relative z-10 leading-normal">Unlock white-label reports & batch analysis</p>
              <button 
                onClick={() => window.location.href = "/settings?tab=billing"}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold py-2 rounded-xl transition-all relative z-10 shadow-lg shadow-indigo-600/30"
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
              className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
            />
            
            {/* Drawer */}
            <aside className="w-72 max-w-[80vw] bg-slate-900 border-r border-white/10 relative z-10 flex flex-col justify-between py-6">
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-1 bg-white/5 hover:bg-white/10 rounded-full text-slate-400"
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
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-slate-400 hover:text-white"
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
                <div className="bg-gradient-to-tr from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-4 text-center space-y-2">
                  <h6 className="text-xs font-bold text-white">Upgrade to Pro</h6>
                  <p className="text-[10px] text-slate-400">White-label reports & batch analysis</p>
                  <button className="w-full bg-indigo-600 text-white text-xs font-extrabold py-2 rounded-xl">
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
