"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Sparkles, 
  MapPin, 
  TrendingUp, 
  ChevronRight, 
  Heart, 
  Eye, 
  FileText, 
  Sliders, 
  CheckSquare, 
  UserCheck, 
  Mail,
  ChevronDown,
  Info,
  Calendar,
  DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn, formatCurrency } from "@/lib/utils";

// Types
interface Recommendation {
  id: string;
  rank: number;
  category: string;
  estimatedCost: number;
  projectedValueIncrease: number;
  roiPercentage: number;
  timeline: string;
  timelineType: "time-quick" | "time-medium" | "time-long";
  roiType: "roi-high" | "roi-medium" | "roi-low";
  explanation: string;
  whyDetails: string;
  scope: { item: string; checked: boolean }[];
}

interface Contractor {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  license: string;
  costEstimate: number;
  timeline: string;
  availability: string;
  speciality: string;
  snippet: string;
}

const MOCK_CONTRACTORS: Record<string, Contractor[]> = {
  "rec-kitchen": [
    {
      id: "c-1",
      name: "Home Remodeling Pro",
      rating: 4.8,
      reviewsCount: 142,
      license: "TCLD-12345",
      costEstimate: 34500,
      timeline: "4-5 weeks",
      availability: "Jan 15, 2025",
      speciality: "High-end kitchen renovations",
      snippet: "Excellent communication, finished on time!"
    },
    {
      id: "c-2",
      name: "Austin Kitchen & Bath Co.",
      rating: 4.6,
      reviewsCount: 89,
      license: "TCLD-56789",
      costEstimate: 35800,
      timeline: "6-7 weeks",
      availability: "Now",
      speciality: "Traditional & modern kitchens",
      snippet: "Very professional crew and great cleanup."
    }
  ],
  "rec-roof": [
    {
      id: "c-3",
      name: "Elite Roofing Austin",
      rating: 4.9,
      reviewsCount: 210,
      license: "ROOF-9912",
      costEstimate: 8200,
      timeline: "1-2 weeks",
      availability: "Next Week",
      speciality: "Structural & shingle repair",
      snippet: "Fast service, handled the insurance details perfectly."
    }
  ],
  "rec-bath": [
    {
      id: "c-4",
      name: "Austin Kitchen & Bath Co.",
      rating: 4.6,
      reviewsCount: 89,
      license: "TCLD-56789",
      costEstimate: 21500,
      timeline: "3-4 weeks",
      availability: "Jan 10, 2025",
      speciality: "Contemporary bathroom spas",
      snippet: "Transformed our outdated bath into a modern oasis."
    }
  ]
};

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-kitchen",
    rank: 1,
    category: "Kitchen Remodel",
    estimatedCost: 35000,
    projectedValueIncrease: 57750,
    roiPercentage: 65,
    timeline: "3-4 months",
    timelineType: "time-medium",
    roiType: "roi-high",
    explanation: "Modern kitchens are key buyer motivators. Your kitchen shows significant age.",
    whyDetails: "Your kitchen was built in 1995. Modern kitchens with updated appliances, quartz counters, and open layouts drive significant buyer interest. Comparable sales that renovated sold 12% faster.",
    scope: [
      { item: "Cabinet refacing/replacement", checked: true },
      { item: "Countertop upgrade (granite/quartz)", checked: true },
      { item: "Backsplash installation", checked: true },
      { item: "Lighting upgrade (LED)", checked: true },
      { item: "Appliance replacement (stove, fridge, dishwasher)", checked: true },
      { item: "Paint & refresh", checked: true },
      { item: "Island addition (not recommended)", checked: false }
    ]
  },
  {
    id: "rec-roof",
    rank: 2,
    category: "Roof Inspection & Repair",
    estimatedCost: 8500,
    projectedValueIncrease: 12325,
    roiPercentage: 45,
    timeline: "1-2 weeks",
    timelineType: "time-quick",
    roiType: "roi-medium",
    explanation: "Buyers are highly concerned about structural integrity. Post-inspection items resolved.",
    whyDetails: "AI Vision identified wear around shingles and flashing. Rectifying this prevents negotiation credit drops during appraisal.",
    scope: [
      { item: "Replace damaged asphalt shingles", checked: true },
      { item: "Reseal vent pipes and chimney flashing", checked: true },
      { item: "Clean gutters and install leaf guards", checked: true },
      { item: "Certify roof structural integrity", checked: false }
    ]
  },
  {
    id: "rec-bath",
    rank: 3,
    category: "Bathroom Modernization",
    estimatedCost: 22000,
    projectedValueIncrease: 33440,
    roiPercentage: 52,
    timeline: "2-3 months",
    timelineType: "time-medium",
    roiType: "roi-high",
    explanation: "Spa-like features in the master suite bathroom increase premium comps matching.",
    whyDetails: "Replacing builder-grade single vanity with custom double quartz vanities and glass shower enclosures.",
    scope: [
      { item: "Custom double vanity installation", checked: true },
      { item: "Premium quartz countertop overlay", checked: true },
      { item: "Frameless glass walk-in shower conversion", checked: true },
      { item: "Updated low-flow fixtures and LED mirrors", checked: true }
    ]
  }
];

const VISUALIZER_IMAGES: Record<string, {
  before: string;
  afterThemes: { value: string; label: string; url: string }[];
}> = {
  "rec-kitchen": {
    before: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    afterThemes: [
      { value: "modern-white", label: "Modern Minimalist (White Quartz)", url: "https://images.unsplash.com/photo-1556911220-1114b88a74e6?auto=format&fit=crop&w=1200&q=80" },
      { value: "warm-wood", label: "Traditional Warm Wood & Marble", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80" },
      { value: "dark-industrial", label: "Industrial Contemporary (Matte Black)", url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80" }
    ]
  },
  "rec-roof": {
    before: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    afterThemes: [
      { value: "shingles-completed", label: "Composite Architectural Shingles", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" }
    ]
  },
  "rec-bath": {
    before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    afterThemes: [
      { value: "modern-spa", label: "Frameless Glass Spa Bath", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80" },
      { value: "classic-quartz", label: "Quartz Counter Double Vanity", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80" }
    ]
  }
};

export default function AnalysisResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Filter/Sort States
  const [filterRoi, setFilterRoi] = useState<string>("all");
  const [filterTime, setFilterTime] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("rank");

  // Hearted recommendations
  const [heartedList, setHeartedList] = useState<Record<string, boolean>>({});

  // Modal Details State
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [modalBeforeAfterPct, setModalBeforeAfterPct] = useState(50);
  const [visualizerTheme, setVisualizerTheme] = useState<string>("modern-white");
  const [activeReportCount, setActiveReportCount] = useState(2);

  // Auto-reset visualizer theme when selecting a different recommendation
  useEffect(() => {
    if (selectedRec) {
      const themes = VISUALIZER_IMAGES[selectedRec.id]?.afterThemes;
      if (themes && themes.length > 0) {
        setVisualizerTheme(themes[0].value);
      } else {
        setVisualizerTheme("");
      }
      setModalBeforeAfterPct(50);
    }
  }, [selectedRec]);

  // Dynamic Comps and AI assessment states
  const [address, setAddress] = useState("2030 Natchez Dr");
  const [city, setCity] = useState("Austin, TX");
  const [analysisDate, setAnalysisDate] = useState("Dec 15, 2024");
  const [overallScore, setOverallScore] = useState(7);
  const [issuesCount, setIssuesCount] = useState(3);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [detectedRooms, setDetectedRooms] = useState<any[]>([]);

  const [uploadedBeforeImg, setUploadedBeforeImg] = useState<string | null>(null);

  // Poll server for property analysis status and results
  useEffect(() => {
    // Load local storage kitchen visualizer mock context if set
    const savedImg = localStorage.getItem("user_uploaded_kitchen_before");
    if (savedImg) {
      setUploadedBeforeImg(savedImg);
    }

    if (!id) return;

    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/analyze/${id}`);
        if (!response.ok) {
          throw new Error("Failed to poll analysis results from server.");
        }
        
        const data = await response.json();
        
        if (data.status === "completed") {
          setStatus("completed");
          setOverallScore(data.cv_results.overall_condition_score || 7.0);
          setIssuesCount(data.cv_results.detected_defects?.length || 0);
          
          // Map dynamic detected rooms from backend
          if (data.cv_results.detected_rooms && data.cv_results.detected_rooms.length > 0) {
            setDetectedRooms(data.cv_results.detected_rooms.map((roomName: string, idx: number) => ({
              name: roomName,
              condition: idx === 1 ? "Outdated / Fair" : "Good",
              badge: idx === 1 ? "status-error" : "status-complete"
            })));
          } else {
            setDetectedRooms([
              { name: "Living Room", condition: "Excellent", badge: "status-complete" },
              { name: "Kitchen", condition: "Outdated / Fair", badge: "status-error" },
              { name: "Master Bedroom", condition: "Good", badge: "status-progress" },
              { name: "Master Bathroom", condition: "Fair", badge: "status-pending" }
            ]);
          }

          // Map dynamic recommendations from backend
          setRecommendations(data.recommendations.map((rec: any, idx: number) => ({
            id: rec.upgrade_id,
            rank: idx + 1,
            category: rec.category,
            estimatedCost: rec.estimated_cost,
            projectedValueIncrease: rec.projected_value_increase,
            roiPercentage: rec.roi_percentage,
            timeline: rec.timeline,
            timelineType: rec.timeline.includes("week") ? "time-quick" : "time-medium",
            roiType: rec.roi_percentage > 50 ? "roi-high" : "roi-medium",
            explanation: rec.explanation,
            whyDetails: rec.why_details,
            scope: rec.scope
          })));

          setLoading(false);
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setStatus("failed");
          setErrorMessage(data.error || "Analysis pipeline execution failed on the server.");
          setLoading(false);
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error("Polling error: ", err);
      }
    };

    // Run first check immediately
    checkStatus();

    // Start interval
    pollInterval = setInterval(checkStatus, 2500);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  const handleHeartToggle = (recId: string) => {
    setHeartedList(prev => ({
      ...prev,
      [recId]: !prev[recId]
    }));
  };

  const handleQuoteRequest = (recCategory: string) => {
    setModalMessage(`Quote requested routed to top-rated contractors! They will review the media uploads and submit estimates within 24 hours.`);
  };

  // Filtered & Sorted recommendations
  const processedRecommendations = useMemo(() => {
    let result = [...recommendations];

    if (filterRoi !== "all") {
      result = result.filter(rec => rec.roiType === filterRoi);
    }
    if (filterTime !== "all") {
      result = result.filter(rec => rec.timelineType === filterTime);
    }

    if (sortField === "roi") {
      result.sort((a, b) => b.roiPercentage - a.roiPercentage);
    } else if (sortField === "cost") {
      result.sort((a, b) => a.estimatedCost - b.estimatedCost);
    } else {
      result.sort((a, b) => a.rank - b.rank);
    }

    return result;
  }, [recommendations, filterRoi, filterTime, sortField]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-extrabold text-white tracking-tight">AI Multimodal Scan in Progress</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Google Gemini is scanning your property photos for structural conditions, room contexts, and defect flags.
          </p>
        </div>
        
        <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-extrabold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 animate-pulse">
          Polling local API gateway...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Property Analysis Results</span>
            <Badge variant="status-complete">Complete</Badge>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Property: <strong>{address}, {city}</strong> • Analyzed: {analysisDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            id="results-pdf-btn"
            variant="secondary" 
            icon={<FileText className="w-4 h-4" />}
            onClick={() => window.location.href = `/reports/report-123`}
          >
            Detailed Report
          </Button>
          <Button 
            id="results-share-btn"
            variant="primary" 
            onClick={() => handleQuoteRequest("All Upgrades")}
          >
            Request All Quotes
          </Button>
        </div>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (40% width on Desktop) */}
        <aside className="lg:col-span-4 space-y-6">
          <Card hoverEffect={false} className="space-y-6 bg-slate-900/50">
            {/* Condition Score Gauge */}
            <div className="text-center space-y-3 pb-6 border-b border-white/10">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Overall Condition Score</h3>
              <div className="inline-flex items-end justify-center">
                <span className="text-5xl font-extrabold text-white">{overallScore}</span>
                <span className="text-xl font-semibold text-slate-500 mb-1">/10</span>
              </div>
              
              {/* Score Gauge Visual */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${overallScore * 10}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Based on defect density and finish grades.</p>
            </div>

            {/* Detected Rooms & Features Accordion List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detected Rooms & Features</h4>
              <div className="space-y-2">
                {detectedRooms.map((room, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                    <span className="font-semibold text-slate-200">🏠 {room.name}</span>
                    <Badge variant={room.badge}>{room.condition}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Condition Summary */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Condition Summary</h4>
              <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Issues Detected:</span>
                  <span className="font-bold text-white">{issuesCount}</span>
                </div>
                <ul className="space-y-1.5 text-slate-350 list-disc list-inside">
                  <li>Outdated kitchen cabinetry (built 1995)</li>
                  <li>Wear shingles flags on roof corners</li>
                  <li>Bathroom spa upgrade opportunities</li>
                </ul>
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Column (60% width on Desktop) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-white">Top ROI Ranked Upgrades</h2>
            
            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300">
              <div>
                <select
                  value={filterRoi}
                  onChange={(e) => setFilterRoi(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All ROI Yields</option>
                  <option value="roi-high">High ROI</option>
                  <option value="roi-medium">Medium ROI</option>
                </select>
              </div>

              <div>
                <select
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Timelines</option>
                  <option value="time-quick">Quick Wins</option>
                  <option value="time-medium">Medium Term</option>
                </select>
              </div>

              <div>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="rank">Recommended Order</option>
                  <option value="roi">ROI% Highest</option>
                  <option value="cost">Cost Lowest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          {(filterRoi !== "all" || filterTime !== "all") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Filters:</span>
              {filterRoi !== "all" && (
                <span className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span>ROI: {filterRoi === "roi-high" ? "High" : "Medium"}</span>
                  <button onClick={() => setFilterRoi("all")} className="text-slate-400 hover:text-white font-bold ml-1 font-mono">×</button>
                </span>
              )}
              {filterTime !== "all" && (
                <span className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span>Timeline: {filterTime === "time-quick" ? "Quick" : "Medium"}</span>
                  <button onClick={() => setFilterTime("all")} className="text-slate-400 hover:text-white font-bold ml-1 font-mono">×</button>
                </span>
              )}
            </div>
          )}

          {/* Recommendation Cards list */}
          <div className="space-y-6">
            {processedRecommendations.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/20 border border-white/10 rounded-2xl">
                <p className="text-slate-400 text-sm font-semibold">No recommendations match the active filter criteria.</p>
              </div>
            ) : (
              processedRecommendations.map((rec) => (
                <Card 
                  key={rec.id} 
                  id={`rec-card-${rec.id}`}
                  className="flex flex-col md:flex-row justify-between gap-6 hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-150 p-6 md:p-8"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-extrabold text-blue-400">#{rec.rank}</span>
                      <h3 className="text-lg font-bold text-white tracking-tight">{rec.category}</h3>
                      <div className="flex gap-2">
                        <Badge variant={rec.roiType}>ROI: {rec.roiPercentage}%</Badge>
                        <Badge variant={rec.timelineType}>{rec.timeline}</Badge>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">{rec.explanation}</p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Estimated Cost</p>
                        <p className="font-extrabold text-white mt-1">{formatCurrency(rec.estimatedCost)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Market Value Add</p>
                        <p className="font-extrabold text-emerald-400 mt-1">{formatCurrency(rec.projectedValueIncrease)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Estimated ROI</p>
                        <p className="font-extrabold text-emerald-400 mt-1">+{rec.roiPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Avg Timeline</p>
                        <p className="font-extrabold text-white mt-1">{rec.timeline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0 gap-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleHeartToggle(rec.id)}
                        className={`p-2 rounded-full border transition-all ${
                          heartedList[rec.id] 
                            ? "bg-red-500/10 border-red-500/25 text-red-500" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                        aria-label={heartedList[rec.id] ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`w-4 h-4 ${heartedList[rec.id] ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    <Button 
                      id={`see-details-btn-${rec.id}`}
                      variant="primary" 
                      size="sm"
                      onClick={() => setSelectedRec(rec)}
                    >
                      See Details
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recommendation Details Modal */}
      {selectedRec && (
        <Modal
          isOpen={!!selectedRec}
          onClose={() => setSelectedRec(null)}
          title={selectedRec.category}
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleHeartToggle(selectedRec.id)}
                  className={`p-2 rounded-full border transition-all ${
                    heartedList[selectedRec.id] 
                      ? "bg-red-500/10 border-red-500/25 text-red-500" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Heart className={`w-4.5 h-4.5 ${heartedList[selectedRec.id] ? "fill-current" : ""}`} />
                </button>
                <span className="text-xs text-slate-400">Save to Dashboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button id="modal-cancel-btn" variant="secondary" onClick={() => setSelectedRec(null)}>Close</Button>
                <Button id="modal-comps-btn" variant="primary" onClick={() => handleQuoteRequest(selectedRec.category)}>Get Contractor Quote</Button>
              </div>
            </div>
          }
          size="lg"
        >
          <div className="space-y-6">
            
            {/* Image Slider Comparison Panel */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interactive AI Design Visualizer</span>
                
                {/* Upgrade options themes picker */}
                {VISUALIZER_IMAGES[selectedRec.id] && (
                  <div className="flex gap-2 flex-wrap">
                    {VISUALIZER_IMAGES[selectedRec.id].afterThemes.map((themeItem) => (
                      <button
                        key={themeItem.value}
                        onClick={() => setVisualizerTheme(themeItem.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all",
                          visualizerTheme === themeItem.value
                            ? "bg-blue-600 border-transparent text-white shadow-md shadow-blue-600/10"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                        )}
                      >
                        {themeItem.label.split(" (")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Slider comparative container */}
              <div className="h-72 md:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 relative border border-white/10 shadow-2xl select-none">
                {VISUALIZER_IMAGES[selectedRec.id] ? (
                  <div className="relative w-full h-full">
                    {/* Before Image (underneath) */}
                    <img
                      src={(selectedRec.id === "rec-kitchen" && uploadedBeforeImg) ? uploadedBeforeImg : VISUALIZER_IMAGES[selectedRec.id].before}
                      alt="Before Upgrade"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute top-4 left-4 bg-slate-950/75 backdrop-blur-xs text-white border border-white/10 font-bold text-[10px] px-2.5 py-1 rounded-lg z-10 shadow-md">
                      Before
                    </div>

                    {/* After Image (overlay, clipped) */}
                    <img
                      src={
                        VISUALIZER_IMAGES[selectedRec.id].afterThemes.find(t => t.value === visualizerTheme)?.url || 
                        VISUALIZER_IMAGES[selectedRec.id].afterThemes[0].url
                      }
                      alt="AI Upgraded Render"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
                      style={{
                        clipPath: `polygon(0 0, ${modalBeforeAfterPct}% 0, ${modalBeforeAfterPct}% 100%, 0 100%)`
                      }}
                    />
                    <div 
                      className="absolute top-4 bg-emerald-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg z-30 shadow-md transition-all animate-pulse"
                      style={{
                        right: `${Math.max(4, 100 - modalBeforeAfterPct + 2)}%`
                      }}
                    >
                      AI Upgraded Render
                    </div>

                    {/* Draggable Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-30 pointer-events-none"
                      style={{ left: `${modalBeforeAfterPct}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-indigo-600 border border-indigo-400 rounded-full flex items-center justify-center shadow-lg text-white font-mono text-xs font-bold">
                        ↔
                      </div>
                    </div>

                    {/* Invisible Input Slider range control covering entire container */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={modalBeforeAfterPct}
                      onChange={(e) => setModalBeforeAfterPct(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-ew-resize"
                      aria-label="Drag before-after visualizer comparison slider"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 p-4">
                    <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
                    <p className="font-bold text-sm text-slate-350">Generating computer vision render preview...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 border border-white/5 rounded-2xl p-5 text-center text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Estimated Cost</span>
                <p className="text-base font-extrabold text-white">{formatCurrency(selectedRec.estimatedCost)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Market Value Increase</span>
                <p className="text-base font-extrabold text-emerald-400">{formatCurrency(selectedRec.projectedValueIncrease)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Estimated ROI</span>
                <p className="text-base font-extrabold text-emerald-400">+{selectedRec.roiPercentage}%</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Avg Timeline</span>
                <p className="text-base font-extrabold text-white">{selectedRec.timeline}</p>
              </div>
            </div>

            {/* Why recommendation */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-widest text-indigo-400">Why this recommendation</h5>
              <p className="text-slate-350 text-xs leading-relaxed">{selectedRec.whyDetails}</p>
            </div>

            {/* Scope checklist */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-widest text-indigo-400">Scope of Work</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRec.scope.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-slate-200">
                    <CheckSquare className={`w-4 h-4 ${item.checked ? "text-blue-500" : "text-slate-500"}`} />
                    <span>{item.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contractors List options */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h5 className="font-bold text-xs uppercase tracking-widest text-indigo-400">Verified Contractor Options</h5>
              
              <div className="space-y-3">
                {(MOCK_CONTRACTORS[selectedRec.id] || []).map((cont) => (
                  <div key={cont.id} className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h6 className="text-sm font-bold text-white">{cont.name}</h6>
                        <Badge variant="roi-high">Verified License</Badge>
                      </div>
                      <p className="text-slate-400">⭐ {cont.rating} ({cont.reviewsCount} reviews) • License: {cont.license}</p>
                      <p className="text-slate-350">Speciality: <strong>{cont.speciality}</strong></p>
                      <p className="italic text-slate-500">"{cont.snippet}"</p>
                    </div>

                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 md:border-l md:border-white/5 md:pl-5">
                      <div className="text-right">
                        <p className="text-slate-500 font-bold uppercase text-[9px]">Est. Cost</p>
                        <p className="text-sm font-bold text-white">{formatCurrency(cont.costEstimate)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Avail: {cont.availability}</p>
                      </div>
                      <Button id={`quote-btn-${cont.id}`} variant="primary" size="sm" onClick={() => handleQuoteRequest(selectedRec.category)}>
                        Get Quote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* System Toast notification modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-3">HomeReady Advisor</h3>
            <p className="text-slate-300 text-sm mb-6">{modalMessage}</p>
            <Button
              id="results-modal-ok-btn"
              onClick={() => setModalMessage(null)}
              className="w-full"
            >
              Acknowledge
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
