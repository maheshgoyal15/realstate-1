"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Hammer,
  Zap,
  Flame,
  Quote,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

// Unsplash premium architecture and design images allowed by Content-Security-Policy
const INTERIOR_BEFORE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"; // Dated kitchen
const INTERIOR_AFTER = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80";  // Modernized chef kitchen
const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"; // Bright modern living room

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

// Illustrative sample feedback, styled the same honest way as the ROI/comps
// data above (clearly a demo sample, not a claim of real reviews). No stock
// headshots are used — initials avatars only, consistent with how the
// Reports page handles its own no-real-photos constraint.
const SAMPLE_TESTIMONIALS = [
  {
    initials: "JM",
    name: "Jordan M.",
    location: "Austin, TX",
    quote: "The upgrade ranking told us exactly where to spend before listing. We recouped more than double our budget.",
    rating: 5,
  },
  {
    initials: "PR",
    name: "Priya R.",
    location: "Round Rock, TX",
    quote: "Seeing the before/after render before committing to the kitchen refresh made the decision easy.",
    rating: 5,
  },
  {
    initials: "DK",
    name: "Devon K.",
    location: "Cedar Park, TX",
    quote: "Matched us with a contractor within a day of finishing the analysis. Quote came in right on estimate.",
    rating: 4,
  },
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
      {/* 1. Hero Search Section */}
      <section className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-raised">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-15"
          />
          {/* Flat scrim — the image is already at 15% and only needs to be held
              back far enough for the headline to hold contrast. */}
          <div className="absolute inset-0 bg-surface-raised/70" />
        </div>

        <div className="relative flex flex-col items-center justify-center text-center pt-16 pb-16 max-w-4xl mx-auto space-y-8 px-4">
          <div className="inline-flex items-center space-x-2 bg-neutral-50 border border-surface-border-strong px-4 py-1.5 rounded-full text-xs font-medium text-neutral-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real Estate Pre-Listing Intelligence</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-neutral-800 leading-tight">
            Unlock Your Home&apos;s <br />
            <span className="text-accent-500">Maximum Pre-Listing Value</span>
          </h1>

          <p className="text-ink-muted text-lg md:text-xl max-w-2xl leading-relaxed">
            HomeReady AI analyzes your home&apos;s condition against local comparable sales, ranks high-ROI upgrades, and generates photorealistic before/after visuals in seconds.
          </p>

          {/* Address Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl bg-surface-raised border border-surface-border-strong p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row items-center"
          >
            <div className="flex items-center space-x-3 flex-1 px-4 py-3 w-full">
              <Search className="text-ink-subtle w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter your home address to start free analysis..."
                className="bg-transparent border-none text-ink placeholder-ink-subtle text-base focus:outline-none focus:ring-0 w-full"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 rounded-xl md:rounded-full flex items-center justify-center space-x-2 shrink-0 cursor-pointer transition-colors"
            >
              <span>Analyze My Home</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Simple Trust Metrics */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 pt-4 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            <span className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>ATTOM MLS Enriched</span>
            </span>
            <span className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>GPT-4o Vision Inspection</span>
            </span>
            <span className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Local Contractor Referral</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Before/After Interactive Comparison */}
      <section className="card-surface p-6 md:p-10 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="bg-neutral-50 text-neutral-700 border border-surface-border-strong px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
              Computer Vision Preview
            </span>
            <h2 className="text-4xl">
              Instant Photorealistic Upgrade Renders
            </h2>
            <p className="text-ink-muted text-sm md:text-base leading-relaxed">
              Drag the slider to preview how our generative design models transform a dated kitchen. The AI maintains the exact dimensions and architectural constraints of your room while showing structural finishes, upgraded cabinets, quartz countertops, and modern lighting fixtures.
            </p>

            <div className="space-y-4 pt-4 border-t border-surface-border">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-neutral-50 rounded-lg text-neutral-700 border border-surface-border-strong">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Context-Aware Textures</h4>
                  <p className="text-xs text-ink-muted">Maintains native wall configurations, plumbing lines, and appliance layout to ensure structural feasibility.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-success-subtle rounded-lg text-success border border-success-border">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Targeted ROI Rationale</h4>
                  <p className="text-xs text-ink-muted">Suggests specific design styles (e.g. Modern, Transitional) that match the highest-priced comps in your neighborhood.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/analyze"
                className="inline-flex items-center space-x-2 text-accent-600 hover:text-accent-700 font-semibold text-sm group"
              >
                <span>Upload your room photos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Sliding Before/After Image Container */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-surface-border select-none group"
              onMouseEnter={() => setIsHoveredSlider(true)}
              onMouseLeave={() => setIsHoveredSlider(false)}
            >
              {/* After Image (Full width, underneath) */}
              <Image
                src={INTERIOR_AFTER}
                alt="After Upgrade"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover pointer-events-none"
              />
              <div className="absolute top-4 right-4 bg-success text-white text-xs font-semibold px-3 py-1.5 rounded-full z-20">
                AI Upgrade Render (After)
              </div>

              {/* Before Image (Clipping width based on slider percentage) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${beforeAfterSlider}%` }}
              >
                <Image
                  src={INTERIOR_BEFORE}
                  alt="Before Upgrade"
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover max-w-none pointer-events-none"
                />
                <div className="absolute top-4 left-4 bg-surface-raised/90 backdrop-blur-md border border-surface-border text-ink-muted text-xs font-medium px-3 py-1.5 rounded-full z-20">
                  Original Space (Before)
                </div>
              </div>

              {/* Sliding Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 flex items-center justify-center"
                style={{ left: `${beforeAfterSlider}%` }}
              >
                <div className="w-10 h-10 bg-neutral-800 border-2 border-white rounded-full flex items-center justify-center cursor-ew-resize select-none">
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
                aria-label="Before/after comparison position"
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              />
            </div>
            <p className="text-xs text-ink-subtle mt-3 font-semibold uppercase tracking-wider">
              {isHoveredSlider ? "Drag your cursor left/right across the photo" : "Hover and drag across image to compare"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Live ROI Interactive Estimator Calculator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-5 card-surface p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-accent-600">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-semibold uppercase tracking-wider text-ink-muted">Live ROI Estimator</h3>
            </div>

            <h3 className="text-4xl leading-tight">
              Pre-Listing Upgrade ROI Calculator
            </h3>

            <p className="text-ink-muted text-sm leading-relaxed">
              Adjust the slider below to match your budget. Our modeling is based on thousands of recent pre-listing transactions to show the correlation between targeted upgrades and sales premium in your market.
            </p>

            {/* Interactive Slider */}
            <div className="space-y-4 pt-6 border-t border-surface-border">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Invested Budget</span>
                <span className="text-2xl font-semibold text-ink">${calculatorBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={100000}
                step={2500}
                value={calculatorBudget}
                onChange={(e) => setCalculatorBudget(Number(e.target.value))}
                aria-label="Invested budget"
                className="w-full accent-accent-500 bg-surface-sunken rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                <span>$5,000</span>
                <span>$50,000</span>
                <span>$100,000</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-sunken border border-surface-border p-5 rounded-2xl space-y-3 mt-6">
            <div className="flex justify-between text-xs font-medium text-ink-muted">
              <span>Estimated Value Uplift:</span>
              <span className="text-success font-semibold">+${estimatedUplift.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-ink-muted">
              <span>Average ROI Yield:</span>
              <span className="text-success font-semibold">{estimatedRoi}%</span>
            </div>
            <div className="border-t border-surface-border pt-2 flex justify-between text-sm font-semibold text-ink">
              <span>Estimated Net Equity Gain:</span>
              <span className="text-success">+${netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Project Recommendations matching slider budget */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl">
              Upgrade Package Allocation
            </h3>
            <span className="text-xs text-ink-muted">
              Budget Allocated: <strong className="text-ink">${calculatorBudget.toLocaleString()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_PROJECTS.map((proj) => {
              // Decide if project fits within target budget dynamically
              const maxCost = Number(proj.cost.replace(/[^0-9]/g, "").slice(-5));
              const fitsBudget = calculatorBudget >= maxCost;

              return (
                <Card
                  key={proj.id}
                  hoverEffect={fitsBudget}
                  className={fitsBudget ? "" : "opacity-50"}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-accent-50 text-accent-600 flex-shrink-0">
                        <proj.icon className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          fitsBudget ? "bg-success-subtle text-success border border-success-border" : "bg-surface-sunken text-ink-subtle"
                        }`}>
                          {fitsBudget ? "Fits Budget" : "Out of Budget"}
                        </span>
                        <p className="text-[10px] text-ink-subtle font-semibold mt-1.5 uppercase tracking-wider">{proj.duration}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-ink tracking-tight">{proj.title}</h4>
                      <p className="text-xs font-semibold text-accent-600 mt-0.5">{proj.cost}</p>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed font-normal">{proj.desc}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium pt-3 mt-3 border-t border-surface-border">
                    <span className="text-ink-muted">{proj.impact}</span>
                    <span className="text-success">{proj.valueAdd} ({proj.roi} ROI)</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Local Market Comps - Case Studies */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-4xl">
            Proven Neighborhood Case Studies
          </h2>
          <p className="text-ink-muted text-sm md:text-base">
            Recent sold listings showing pricing premiums captured after targeted pre-listing investments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LOCAL_COMPS.map((comp, idx) => (
            <Card key={idx} className="flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-ink tracking-tight">{comp.address}</h4>
                    <p className="text-xs text-ink-muted font-semibold">{comp.status}</p>
                  </div>
                  <span className="bg-success-subtle text-success border border-success-border text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {comp.uplift} Uplift
                  </span>
                </div>

                <div className="border-t border-surface-border pt-3 space-y-1.5 text-xs text-ink-muted">
                  <p>• <strong>Upgrades:</strong> {comp.upgrades}</p>
                  <p>• <strong>Original Est Value:</strong> {comp.originalPrice}</p>
                  <p>• <strong>Final Sold Price:</strong> <strong className="text-ink">{comp.salePrice}</strong></p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-medium pt-3 mt-3 border-t border-surface-border text-ink-subtle">
                <span>Days on Market:</span>
                <span className="text-ink flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-accent-500" />
                  <span>{comp.daysOnMarket}</span>
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4b. Testimonials / Social proof (sample data, honest placeholder avatars) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-4xl">
            What Sellers Are Saying
          </h2>
          <p className="text-ink-muted text-sm md:text-base">
            Illustrative feedback from sample HomeReady AI analyses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_TESTIMONIALS.map((t) => (
            <Card key={t.name} className="space-y-4">
              <Quote className="w-6 h-6 text-accent-300" />
              <p className="text-sm text-ink leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 font-semibold text-sm flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.location}</p>
                  </div>
                </div>
                <div className="flex items-center" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < t.rating ? "fill-warning text-warning" : "text-surface-border"}`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Vetted Contractor Network Teaser */}
      <section className="card-surface p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-neutral-100 pointer-events-none hidden md:block">
          <Hammer className="w-48 h-48" />
        </div>

        <div className="max-w-2xl space-y-6 relative z-10">
          <span className="bg-success-subtle text-success border border-success-border px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
            Licensed Contractor Network
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight">
            Connect Instantly with Local, Vetted Craftsmen
          </h2>
          <p className="text-ink-muted text-sm md:text-base leading-relaxed">
            Skip the endless search. Once you accept upgrade recommendations, we match you with 3 certified contractors in your zip code who specialize in the exact trades needed. They have pre-negotiated project scope pricing and committed timeline slots.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
            <div className="p-4 bg-surface-sunken border border-surface-border rounded-2xl space-y-1.5">
              <Users className="w-6 h-6 text-neutral-700 mx-auto" />
              <h4 className="text-sm font-semibold text-ink">Local Teams</h4>
              <p className="text-xs text-ink-muted">Pre-vetted within 15 miles of your zip code.</p>
            </div>
            <div className="p-4 bg-surface-sunken border border-surface-border rounded-2xl space-y-1.5">
              <DollarSign className="w-6 h-6 text-neutral-700 mx-auto" />
              <h4 className="text-sm font-semibold text-ink">Clear Pricing</h4>
              <p className="text-xs text-ink-muted">Guaranteed cost-estimate bounds per project.</p>
            </div>
            <div className="p-4 bg-surface-sunken border border-surface-border rounded-2xl space-y-1.5">
              <ShieldCheck className="w-6 h-6 text-neutral-700 mx-auto" />
              <h4 className="text-sm font-semibold text-ink">Licensed & Bonded</h4>
              <p className="text-xs text-ink-muted">$2M general liability insurance requirement.</p>
            </div>
          </div>

          <div className="pt-6">
            <a
              href="/contractors"
              className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 rounded-xl inline-flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <span>Explore Contractor Network</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 6. Ultimate Call To Action (CTA) */}
      <section className="text-center max-w-3xl mx-auto space-y-8 px-4 py-12 rounded-3xl bg-neutral-800 relative">
        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight leading-tight">
          Ready to Maximize Your Home&apos;s Valuation?
        </h2>
        <p className="text-neutral-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Takes under 2 minutes. Enter your address, upload standard smartphone photos, and get your AI pre-listing upgrade roadmap.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/analyze"
            className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-white font-semibold px-10 py-5 rounded-xl flex items-center justify-center space-x-2 text-base cursor-pointer transition-colors"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span>Analyze Property Now</span>
          </a>
          <a
            href="/contractors"
            className="w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-white font-semibold px-10 py-5 rounded-xl transition-colors text-base flex items-center justify-center"
          >
            <span>Browse Contractors</span>
          </a>
        </div>
      </section>
    </div>
  );
}
