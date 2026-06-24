"use client";

import React, { useState } from "react";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Home, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  DollarSign, 
  Hammer, 
  Zap, 
  Flame
} from "lucide-react";

// Unsplash premium architecture and design images allowed by Content-Security-Policy
const INTERIOR_BEFORE = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"; // Dated kitchen
const INTERIOR_AFTER = "https://images.unsplash.com/photo-1556911220-1114b88a74e6?auto=format&fit=crop&w=1200&q=80";  // Modernized chef kitchen

const SAMPLE_PROJECTS = [
  {
    id: "proj-1",
    title: "Kitchen Modernization",
    cost: "$12,000 - $18,000",
    valueAdd: "+$28,500 Value",
    roi: "175%",
    duration: "7-10 Days",
    impact: "High Impact",
    desc: "Reface cabinets, install white quartz countertops, update to stainless steel appliances and matte black hardware.",
    icon: Flame,
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30"
  },
  {
    id: "proj-2",
    title: "Primary Bath Spa Conversion",
    cost: "$8,500 - $13,000",
    valueAdd: "+$19,000 Value",
    roi: "160%",
    duration: "5-7 Days",
    impact: "High Impact",
    desc: "Replace builder-grade vanity, install frameless glass rain shower, apply modern porcelain tile floors.",
    icon: Sparkles,
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30"
  },
  {
    id: "proj-3",
    title: "Engineered Hardwood Upgrade",
    cost: "$6,000 - $9,500",
    valueAdd: "+$12,500 Value",
    roi: "145%",
    duration: "3-4 Days",
    impact: "Medium Impact",
    desc: "Replace dated carpet in living areas with wide-plank engineered hardwood flooring (natural oak finish).",
    icon: TrendingUp,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30"
  },
  {
    id: "proj-4",
    title: "Designer Lighting & Smart Home",
    cost: "$2,500 - $4,000",
    valueAdd: "+$6,200 Value",
    roi: "180%",
    duration: "1-2 Days",
    impact: "Quick Win",
    desc: "Install recessed smart LEDs, designer pendant lights in kitchen/dining, and smart Nest thermostat + door locks.",
    icon: Zap,
    color: "from-purple-500/20 to-fuchsia-500/20 text-purple-400 border-purple-500/30"
  }
];

const LOCAL_COMPS = [
  {
    address: "2038 Natchez Dr",
    status: "Sold 3 weeks ago",
    originalPrice: "$1,150,000",
    salePrice: "$1,275,000",
    upgrades: "Kitchen + Bath Modernization",
    uplift: "+$125,000",
    daysOnMarket: "4 Days"
  },
  {
    address: "2204 Cascade Loop",
    status: "Sold 1 month ago",
    originalPrice: "$890,000",
    salePrice: "$978,000",
    upgrades: "Flooring + Interior Paint + Landscaping",
    uplift: "+$88,000",
    daysOnMarket: "6 Days"
  },
  {
    address: "1815 Oak Lawn Ave",
    status: "Sold 2 months ago",
    originalPrice: "$1,380,000",
    salePrice: "$1,540,000",
    upgrades: "Full Pre-listing Upgrade Package",
    uplift: "+$160,000",
    daysOnMarket: "3 Days"
  }
];

export default function HomePage() {
  const [addressInput, setAddressInput] = useState("");
  const [calculatorBudget, setCalculatorBudget] = useState(25000);
  const [beforeAfterSlider, setBeforeAfterSlider] = useState(50); // percentage (0 - 100)
  const [isHoveredSlider, setIsHoveredSlider] = useState(false);

  // Live dynamic calculation for uplift based on budget slider
  const estimatedUplift = Math.round(calculatorBudget * 1.62);
  const netProfit = estimatedUplift - calculatorBudget;
  const estimatedRoi = 162;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      window.location.href = `/analyze?address=${encodeURIComponent(addressInput)}`;
    } else {
      window.location.href = "/analyze";
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBeforeAfterSlider(Number(e.target.value));
  };

  return (
    <div className="space-y-20 pb-12">
      {/* 1. Hero Search Section (Zillow/Redfin Style) */}
      <section className="relative flex flex-col items-center justify-center text-center pt-8 md:pt-16 max-w-4xl mx-auto space-y-8 px-4">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/25 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-300 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real Estate Pre-Listing Intelligence</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Unlock Your Home's <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Maximum Pre-Listing Value
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          HomeReady AI analyzes your home's condition against local comparable sales, ranks high-ROI upgrades, and generates photorealistic before/after visuals in seconds.
        </p>

        {/* Address Search Form */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="w-full max-w-2xl bg-slate-900/90 border border-white/10 p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row items-center shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center space-x-3 flex-1 px-4 py-3 w-full">
            <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter your home address to start free analysis..."
              className="bg-transparent border-none text-white placeholder-slate-500 text-base focus:outline-none focus:ring-0 w-full"
            />
          </div>
          
          <button
            type="submit"
            className="w-full md:w-auto btn-gradient text-white font-extrabold px-8 py-4 rounded-xl md:rounded-full flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-lg hover:shadow-indigo-500/40"
          >
            <span>Analyze My Home</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Simple Trust Metrics */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>ATTOM MLS Enriched</span>
          </span>
          <span className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>GPT-4o Vision Inspection</span>
          </span>
          <span className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Local Contractor Referral</span>
          </span>
        </div>
      </section>

      {/* 2. Before/After Interactive Comparison (Zillow Lens Style) */}
      <section className="glass-card p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Computer Vision Preview
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Instant Photorealistic Upgrade Renders
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Drag the slider to preview how our generative design models transform a dated kitchen. The AI maintains the exact dimensions and architectural constraints of your room while showing structural finishes, upgraded cabinets, quartz countertops, and modern lighting fixtures.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Context-Aware Textures</h4>
                  <p className="text-xs text-slate-400">Maintains native wall configurations, plumbing lines, and appliance layout to ensure structural feasibility.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Targeted ROI Rationale</h4>
                  <p className="text-xs text-slate-400">Suggests specific design styles (e.g. Modern, Transitional) that match the highest-priced comps in your neighborhood.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/analyze"
                className="inline-flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 font-extrabold text-sm group"
              >
                <span>Upload your room photos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Sliding Before/After Image Container */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div 
              className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 shadow-2xl select-none group"
              onMouseEnter={() => setIsHoveredSlider(true)}
              onMouseLeave={() => setIsHoveredSlider(false)}
            >
              {/* After Image (Full width, underneath) */}
              <img 
                src={INTERIOR_AFTER} 
                alt="After Upgrade" 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-full z-20 shadow-md">
                AI Upgrade Render (After)
              </div>

              {/* Before Image (Clipping width based on slider percentage) */}
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${beforeAfterSlider}%` }}
              >
                <img 
                  src={INTERIOR_BEFORE} 
                  alt="Before Upgrade" 
                  className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full z-20 shadow-md">
                  Original Space (Before)
                </div>
              </div>

              {/* Sliding Divider Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 flex items-center justify-center"
                style={{ left: `${beforeAfterSlider}%` }}
              >
                <div className="w-10 h-10 bg-slate-950 border-2 border-white rounded-full flex items-center justify-center shadow-2xl cursor-ew-resize select-none">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 4 4 4m8-8l4 4-4 4" />
                  </svg>
                </div>
              </div>

              {/* Hidden range input covering image to capture drag action on overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={beforeAfterSlider}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              />
            </div>
            <p className="text-xs text-slate-500 mt-3 font-semibold uppercase tracking-wider">
              {isHoveredSlider ? "Drag your cursor left/right across the photo" : "Hover and drag across image to compare"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Live ROI Interactive Estimator Calculator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-5 bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-x-2 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-bold uppercase tracking-wider text-slate-300">Live ROI Estimator</h3>
            </div>
            
            <h3 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Pre-Listing Upgrade ROI Calculator
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Adjust the slider below to match your budget. Our modeling is based on thousands of recent pre-listing transactions to show the correlation between targeted upgrades and sales premium in your market.
            </p>

            {/* Interactive Slider */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invested Budget</span>
                <span className="text-2xl font-extrabold text-white">${calculatorBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={100000}
                step={2500}
                value={calculatorBudget}
                onChange={(e) => setCalculatorBudget(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>$5,000</span>
                <span>$50,000</span>
                <span>$100,000</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-3 mt-6">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Estimated Value Uplift:</span>
              <span className="text-emerald-400 font-bold">+${estimatedUplift.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Average ROI Yield:</span>
              <span className="text-emerald-400 font-bold">{estimatedRoi}%</span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-extrabold text-white">
              <span>Estimated Net Equity Gain:</span>
              <span className="text-emerald-400">+${netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Project Recommendations matching slider budget */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Upgrade Package Allocation
            </h3>
            <span className="text-xs text-slate-400">
              Budget Allocated: <strong className="text-slate-200">${calculatorBudget.toLocaleString()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_PROJECTS.map((proj) => {
              // Decide if project fits within target budget dynamically
              const maxCost = Number(proj.cost.replace(/[^0-9]/g, "").slice(-5));
              const fitsBudget = calculatorBudget >= maxCost;

              return (
                <article
                  key={proj.id}
                  className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 ${
                    fitsBudget 
                      ? "bg-slate-900/80 border-slate-700/80 shadow-md" 
                      : "bg-slate-950/20 border-white/5 opacity-40 hover:opacity-50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl border flex-shrink-0 bg-gradient-to-tr ${proj.color}`}>
                        <proj.icon className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          fitsBudget ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25" : "bg-slate-800 text-slate-500"
                        }`}>
                          {fitsBudget ? "Fits Budget" : "Out of Budget"}
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-wider">{proj.duration}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white tracking-tight">{proj.title}</h4>
                      <p className="text-xs font-semibold text-indigo-300 mt-0.5">{proj.cost}</p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{proj.desc}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-white/5">
                    <span className="text-slate-400">{proj.impact}</span>
                    <span className="text-emerald-400">{proj.valueAdd} ({proj.roi} ROI)</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Local Market Comps - Zillow Style Case Studies */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Proven Neighborhood Case Studies
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Recent sold listings showing pricing premiums captured after targeted pre-listing investments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LOCAL_COMPS.map((comp, idx) => (
            <div key={idx} className="glass-panel p-6 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{comp.address}</h4>
                    <p className="text-xs text-slate-400 font-semibold">{comp.status}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                    {comp.uplift} Uplift
                  </span>
                </div>
                
                <div className="border-t border-white/5 pt-3 space-y-1.5 text-xs text-slate-300">
                  <p>• <strong>Upgrades:</strong> {comp.upgrades}</p>
                  <p>• <strong>Original Est Value:</strong> {comp.originalPrice}</p>
                  <p>• <strong>Final Sold Price:</strong> <strong className="text-white">{comp.salePrice}</strong></p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-3 border-t border-white/5 text-slate-500">
                <span>Days on Market:</span>
                <span className="text-white flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{comp.daysOnMarket}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Vetted Contractor Network Teaser */}
      <section className="glass-card p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-indigo-500/15 pointer-events-none hidden md:block">
          <Hammer className="w-48 h-48" />
        </div>
        
        <div className="max-w-2xl space-y-6 relative z-10">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Licensed Contractor Network
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Connect Instantly with Local, Vetted Craftsmen
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Skip the endless search. Once you accept upgrade recommendations, we match you with 3 certified contractors in your zip code who specialize in the exact trades needed. They have pre-negotiated project scope pricing and committed timeline slots.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1.5">
              <Users className="w-6 h-6 text-indigo-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Local Teams</h4>
              <p className="text-xs text-slate-400">Pre-vetted within 15 miles of your zip code.</p>
            </div>
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1.5">
              <DollarSign className="w-6 h-6 text-indigo-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Clear Pricing</h4>
              <p className="text-xs text-slate-400">Guaranteed cost-estimate bounds per project.</p>
            </div>
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1.5">
              <ShieldCheck className="w-6 h-6 text-indigo-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Licensed & Bonded</h4>
              <p className="text-xs text-slate-400">$2M general liability insurance requirement.</p>
            </div>
          </div>

          <div className="pt-6">
            <a
              href="/contractors"
              className="btn-gradient text-white font-extrabold px-8 py-4 rounded-xl inline-flex items-center space-x-2 shadow-lg cursor-pointer"
            >
              <span>Explore Contractor Network</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 6. Ultimate Call To Action (CTA) */}
      <section className="text-center max-w-3xl mx-auto space-y-8 px-4 py-8 relative">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Ready to Maximize Your Home's Valuation?
        </h2>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Takes under 2 minutes. Enter your address, upload standard smartphone photos, and get your AI pre-listing upgrade roadmap.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/analyze"
            className="w-full sm:w-auto btn-gradient text-white font-extrabold px-10 py-5 rounded-xl shadow-2xl flex items-center justify-center space-x-2 text-base cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span>Analyze Property Now</span>
          </a>
          <a
            href="/contractors"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-bold px-10 py-5 rounded-xl transition-all text-base flex items-center justify-center"
          >
            <span>Browse Contractors</span>
          </a>
        </div>
      </section>
    </div>
  );
}
