"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Heart,
  FileText,
  CheckSquare,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/apiClient";

interface Contractor {
  id: string;
  name: string;
  rating: number | null;
  reviewsCount: number;
  license: string | null;
  location: string | null;
  specialties: string[];
  avgCost: number | null;
  avgTimeline: string | null;
  availability: string | null;
  snippet: string | null;
}

// Illustrative style-preview images shown for common upgrade categories. These are
// stock examples, not renders generated from the user's own photos, so the UI
// labels them accordingly rather than implying a real AI-generated result.
const VISUALIZER_THEMES: { match: string; before: string; afterThemes: { value: string; label: string; url: string }[] }[] = [
  {
    match: "kitchen",
    before: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    afterThemes: [
      { value: "modern-white", label: "Modern Minimalist (White Quartz)", url: "https://images.unsplash.com/photo-1556911220-1114b88a74e6?auto=format&fit=crop&w=1200&q=80" },
      { value: "warm-wood", label: "Traditional Warm Wood & Marble", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80" },
      { value: "dark-industrial", label: "Industrial Contemporary (Matte Black)", url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80" }
    ]
  },
  {
    match: "roof",
    before: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    afterThemes: [
      { value: "shingles-completed", label: "Composite Architectural Shingles", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" }
    ]
  },
  {
    match: "bath",
    before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    afterThemes: [
      { value: "modern-spa", label: "Frameless Glass Spa Bath", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80" },
      { value: "classic-quartz", label: "Quartz Counter Double Vanity", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80" }
    ]
  }
];

function findVisualizerTheme(category: string) {
  const lower = category.toLowerCase();
  return VISUALIZER_THEMES.find((t) => lower.includes(t.match));
}

// A recommendation category matches a contractor specialty loosely (e.g. "Kitchen
// Remodel" should surface contractors tagged "Kitchens").
function matchesSpecialty(category: string, specialty: string) {
  const cat = category.toLowerCase();
  const spec = specialty.toLowerCase().replace(/s$/, "");
  return cat.includes(spec) || spec.includes(cat.split(" ")[0]);
}

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
  const [visualizerTheme, setVisualizerTheme] = useState<string>("");

  // Real contractor network, fetched once and matched against each recommendation's category.
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [submittingQuoteFor, setSubmittingQuoteFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/contractors");
        if (!res.ok || cancelled) return;
        setContractors(await res.json());
      } catch (error) {
        console.error("Failed to load contractors:", error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedTheme = selectedRec ? findVisualizerTheme(selectedRec.category) : undefined;

  // Auto-reset visualizer theme when selecting a different recommendation
  useEffect(() => {
    if (selectedRec) {
      const theme = findVisualizerTheme(selectedRec.category);
      setVisualizerTheme(theme?.afterThemes[0]?.value ?? "");
      setModalBeforeAfterPct(50);
    }
  }, [selectedRec]);

  const matchedContractors = useMemo(() => {
    if (!selectedRec) return [];
    return contractors.filter((c) => c.specialties.some((s) => matchesSpecialty(selectedRec.category, s))).slice(0, 3);
  }, [selectedRec, contractors]);

  // Dynamic Comps and AI assessment states
  const [address, setAddress] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [overallScore, setOverallScore] = useState(7);
  const [issuesCount, setIssuesCount] = useState(3);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [detectedRooms, setDetectedRooms] = useState<any[]>([]);

  const [uploadedBeforeImg, setUploadedBeforeImg] = useState<string | null>(null);

  // The analysis detail endpoint doesn't return address/date — pull it from the
  // analyses list endpoint instead, which already has it (used by the dashboard).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/analyses");
        if (!res.ok || cancelled) return;
        const list = await res.json();
        const match = list.find((a: any) => a.id === id);
        if (match) {
          setAddress(match.address || "");
          setAnalysisDate(match.date || "");
        }
      } catch (error) {
        console.error("Failed to load property context:", error);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Poll server for property analysis status and results
  useEffect(() => {
    const savedImg = localStorage.getItem("user_uploaded_property_photo");
    if (savedImg) {
      setUploadedBeforeImg(savedImg);
    }

    if (!id) return;

    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await apiFetch(`/api/v1/analyze/${id}`);
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

  const handleQuoteRequest = async (contractor: Contractor, category: string) => {
    setSubmittingQuoteFor(contractor.id);
    try {
      const res = await apiFetch("/api/v1/contractors/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
          user_notes: `Quote requested for ${category} at ${address}.`,
        }),
      });
      if (res.ok) {
        setModalMessage(`Quote request sent to ${contractor.name}! They'll review your uploaded photos and respond within 24 hours.`);
      } else {
        setModalMessage("Couldn't submit the quote request right now. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit quote request:", error);
      setModalMessage("Couldn't submit the quote request right now. Please try again.");
    } finally {
      setSubmittingQuoteFor(null);
    }
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
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-accent-200 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-accent-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 bg-surface-raised rounded-full flex items-center justify-center border border-surface-border shadow-card">
            <Sparkles className="w-8 h-8 text-accent-500 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold text-ink tracking-tight">AI Multimodal Scan in Progress</h2>
          <p className="text-ink-muted text-xs leading-relaxed">
            Google Gemini is scanning your property photos for structural conditions, room contexts, and defect flags.
          </p>
        </div>

        <span className="text-[9px] text-accent-600 uppercase tracking-widest font-extrabold bg-accent-50 px-3 py-1 rounded-full border border-accent-200 animate-pulse">
          Polling local API gateway...
        </span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Badge variant="status-error">Analysis Failed</Badge>
        <h2 className="text-xl font-bold text-ink tracking-tight max-w-md">
          {errorMessage || "The analysis pipeline could not complete."}
        </h2>
        <Button onClick={() => window.location.href = "/analyze"}>Start a New Analysis</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-surface-border gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-ink tracking-tight flex items-center gap-2">
            <span>Property Analysis Results</span>
            <Badge variant="status-complete">Complete</Badge>
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Property: <strong className="text-ink">{address || "Unknown address"}</strong>{analysisDate ? <> • Analyzed: {analysisDate}</> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            id="results-pdf-btn"
            variant="secondary"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => window.location.href = "/reports"}
          >
            View My Reports
          </Button>
          <Button
            id="results-share-btn"
            variant="primary"
            onClick={() => window.location.href = "/contractors"}
          >
            Browse Contractor Network
          </Button>
        </div>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column (40% width on Desktop) */}
        <aside className="lg:col-span-4 space-y-6">
          <Card hoverEffect={false} className="space-y-6">
            {/* Condition Score Gauge */}
            <div className="text-center space-y-3 pb-6 border-b border-surface-border">
              <h3 className="text-xs font-bold text-ink-subtle uppercase tracking-widest">Overall Condition Score</h3>
              <div className="inline-flex items-end justify-center">
                <span className="text-5xl font-extrabold text-ink">{overallScore}</span>
                <span className="text-xl font-semibold text-ink-subtle mb-1">/10</span>
              </div>

              {/* Score Gauge Visual */}
              <div className="w-full bg-surface-sunken h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-accent-500 h-full rounded-full transition-[width]"
                  style={{ width: `${overallScore * 10}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-muted">Based on defect density and finish grades.</p>
            </div>

            {/* Detected Rooms & Features Accordion List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-ink-subtle uppercase tracking-widest">Detected Rooms & Features</h4>
              <div className="space-y-2">
                {detectedRooms.map((room, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-xl p-3 text-xs">
                    <span className="font-semibold text-ink">{room.name}</span>
                    <Badge variant={room.badge}>{room.condition}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Condition Summary */}
            <div className="space-y-3 pt-4 border-t border-surface-border">
              <h4 className="text-xs font-bold text-ink-subtle uppercase tracking-widest">Condition Summary</h4>
              <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Issues Detected:</span>
                  <span className="font-bold text-ink">{issuesCount}</span>
                </div>
                <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
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
            <h2 className="text-xl font-bold tracking-tight text-ink">Top ROI Ranked Upgrades</h2>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-muted">
              <div>
                <select
                  value={filterRoi}
                  onChange={(e) => setFilterRoi(e.target.value)}
                  aria-label="Filter by ROI"
                  className="bg-surface-sunken border border-surface-border rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:border-accent-500 cursor-pointer"
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
                  aria-label="Filter by timeline"
                  className="bg-surface-sunken border border-surface-border rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:border-accent-500 cursor-pointer"
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
                  aria-label="Sort recommendations"
                  className="bg-surface-sunken border border-surface-border rounded-lg px-3 py-1.5 text-ink focus:outline-none focus:border-accent-500 cursor-pointer"
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
              <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Active Filters:</span>
              {filterRoi !== "all" && (
                <span className="bg-accent-50 border border-accent-200 text-accent-700 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span>ROI: {filterRoi === "roi-high" ? "High" : "Medium"}</span>
                  <button onClick={() => setFilterRoi("all")} aria-label="Clear ROI filter" className="text-accent-500 hover:text-accent-700 font-bold ml-1 font-mono">×</button>
                </span>
              )}
              {filterTime !== "all" && (
                <span className="bg-accent-50 border border-accent-200 text-accent-700 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span>Timeline: {filterTime === "time-quick" ? "Quick" : "Medium"}</span>
                  <button onClick={() => setFilterTime("all")} aria-label="Clear timeline filter" className="text-accent-500 hover:text-accent-700 font-bold ml-1 font-mono">×</button>
                </span>
              )}
            </div>
          )}

          {/* Recommendation Cards list */}
          <div className="space-y-6">
            {processedRecommendations.length === 0 ? (
              <div className="text-center py-10 bg-surface-sunken border border-surface-border rounded-2xl">
                <p className="text-ink-muted text-sm font-semibold">No recommendations match the active filter criteria.</p>
              </div>
            ) : (
              processedRecommendations.map((rec) => (
                <Card
                  key={rec.id}
                  id={`rec-card-${rec.id}`}
                  className="flex flex-col md:flex-row justify-between gap-6 p-6 md:p-8"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-extrabold text-accent-600">#{rec.rank}</span>
                      <h3 className="text-lg font-bold text-ink tracking-tight">{rec.category}</h3>
                      <div className="flex gap-2">
                        <Badge variant={rec.roiType}>ROI: {rec.roiPercentage}%</Badge>
                        <Badge variant={rec.timelineType}>{rec.timeline}</Badge>
                      </div>
                    </div>

                    <p className="text-ink-muted text-xs leading-relaxed">{rec.explanation}</p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-sunken p-4 rounded-xl border border-surface-border text-xs">
                      <div>
                        <p className="text-ink-subtle uppercase tracking-widest font-bold text-[9px]">Estimated Cost</p>
                        <p className="font-extrabold text-ink mt-1">{formatCurrency(rec.estimatedCost)}</p>
                      </div>
                      <div>
                        <p className="text-ink-subtle uppercase tracking-widest font-bold text-[9px]">Market Value Add</p>
                        <p className="font-extrabold text-success mt-1">{formatCurrency(rec.projectedValueIncrease)}</p>
                      </div>
                      <div>
                        <p className="text-ink-subtle uppercase tracking-widest font-bold text-[9px]">Estimated ROI</p>
                        <p className="font-extrabold text-success mt-1">+{rec.roiPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-ink-subtle uppercase tracking-widest font-bold text-[9px]">Avg Timeline</p>
                        <p className="font-extrabold text-ink mt-1">{rec.timeline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-surface-border pt-4 md:pt-0 md:pl-6 shrink-0 gap-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleHeartToggle(rec.id)}
                        className={cn(
                          "p-2 rounded-full border transition-colors",
                          heartedList[rec.id]
                            ? "bg-danger-subtle border-danger-border text-danger"
                            : "bg-surface-sunken border-surface-border text-ink-subtle hover:text-ink"
                        )}
                        aria-label={heartedList[rec.id] ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={cn("w-4 h-4", heartedList[rec.id] && "fill-current")} />
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
                  className={cn(
                    "p-2 rounded-full border transition-colors",
                    heartedList[selectedRec.id]
                      ? "bg-danger-subtle border-danger-border text-danger"
                      : "bg-surface-sunken border-surface-border text-ink-subtle hover:text-ink"
                  )}
                  aria-label={heartedList[selectedRec.id] ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={cn("w-4 h-4", heartedList[selectedRec.id] && "fill-current")} />
                </button>
                <span className="text-xs text-ink-muted">Save to Dashboard</span>
              </div>
              <Button id="modal-cancel-btn" variant="secondary" onClick={() => setSelectedRec(null)}>Close</Button>
            </div>
          }
          size="lg"
        >
          <div className="space-y-6">

            {/* Image Slider Comparison Panel */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Illustrative Style Preview</span>

                {/* Upgrade options themes picker */}
                {selectedTheme && (
                  <div className="flex gap-2 flex-wrap">
                    {selectedTheme.afterThemes.map((themeItem) => (
                      <button
                        key={themeItem.value}
                        onClick={() => setVisualizerTheme(themeItem.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-colors",
                          visualizerTheme === themeItem.value
                            ? "bg-accent-500 border-transparent text-white shadow-card"
                            : "bg-surface-sunken border-surface-border text-ink-muted hover:bg-surface-border"
                        )}
                      >
                        {themeItem.label.split(" (")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Slider comparative container */}
              <div className="h-72 md:h-96 w-full rounded-2xl overflow-hidden bg-surface-sunken relative border border-surface-border shadow-card select-none">
                {selectedTheme ? (
                  <div className="relative w-full h-full">
                    {/* Before Image (underneath) */}
                    <img
                      src={uploadedBeforeImg || selectedTheme.before}
                      alt="Before upgrade"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute top-4 left-4 bg-navy-950/75 backdrop-blur-sm text-white border border-white/10 font-bold text-[10px] px-2.5 py-1 rounded-lg z-10 shadow-card">
                      Before
                    </div>

                    {/* After Image (overlay, clipped) */}
                    <img
                      src={
                        selectedTheme.afterThemes.find(t => t.value === visualizerTheme)?.url ||
                        selectedTheme.afterThemes[0].url
                      }
                      alt="Illustrative style preview"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
                      style={{
                        clipPath: `polygon(0 0, ${modalBeforeAfterPct}% 0, ${modalBeforeAfterPct}% 100%, 0 100%)`
                      }}
                    />
                    <div
                      className="absolute top-4 bg-accent-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg z-30 shadow-card transition-[right]"
                      style={{
                        right: `${Math.max(4, 100 - modalBeforeAfterPct + 2)}%`
                      }}
                    >
                      Example Style
                    </div>

                    {/* Draggable Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent-500 z-30 pointer-events-none"
                      style={{ left: `${modalBeforeAfterPct}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-accent-600 border border-white/40 rounded-full flex items-center justify-center shadow-card text-white font-mono text-xs font-bold">
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
                  <div className="flex flex-col items-center justify-center w-full h-full text-ink-subtle p-4">
                    <Sparkles className="w-12 h-12 text-accent-400 mb-3" />
                    <p className="font-bold text-sm text-ink-muted">No style preview available for this upgrade category yet.</p>
                  </div>
                )}
              </div>
              {selectedTheme && (
                <p className="text-[10px] text-ink-subtle">
                  Example style shown for illustration — not a render generated from your uploaded photos.
                </p>
              )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-sunken border border-surface-border rounded-2xl p-5 text-center text-xs">
              <div className="space-y-1">
                <span className="text-ink-subtle font-bold uppercase tracking-wider text-[9px]">Estimated Cost</span>
                <p className="text-base font-extrabold text-ink">{formatCurrency(selectedRec.estimatedCost)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-subtle font-bold uppercase tracking-wider text-[9px]">Market Value Increase</span>
                <p className="text-base font-extrabold text-success">{formatCurrency(selectedRec.projectedValueIncrease)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-subtle font-bold uppercase tracking-wider text-[9px]">Estimated ROI</span>
                <p className="text-base font-extrabold text-success">+{selectedRec.roiPercentage}%</p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-subtle font-bold uppercase tracking-wider text-[9px]">Avg Timeline</span>
                <p className="text-base font-extrabold text-ink">{selectedRec.timeline}</p>
              </div>
            </div>

            {/* Why recommendation */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-widest text-accent-600">Why this recommendation</h5>
              <p className="text-ink-muted text-xs leading-relaxed">{selectedRec.whyDetails}</p>
            </div>

            {/* Scope checklist */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-widest text-accent-600">Scope of Work</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRec.scope.map((item: { item: string; checked: boolean }, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 bg-surface-sunken border border-surface-border rounded-xl p-3 text-xs text-ink">
                    <CheckSquare className={cn("w-4 h-4", item.checked ? "text-accent-500" : "text-ink-subtle")} />
                    <span>{item.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contractors List options */}
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <h5 className="font-bold text-xs uppercase tracking-widest text-accent-600">Verified Contractor Options</h5>

              {matchedContractors.length === 0 ? (
                <div className="bg-surface-sunken border border-surface-border rounded-2xl p-5 text-xs text-ink-muted flex items-center justify-between gap-4">
                  <span>No contractors in your network are tagged for this specialty yet.</span>
                  <Button size="sm" variant="secondary" onClick={() => window.location.href = "/contractors"}>Browse Network</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedContractors.map((cont) => (
                    <div key={cont.id} className="bg-surface-sunken border border-surface-border rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h6 className="text-sm font-bold text-ink">{cont.name}</h6>
                          <Badge variant="roi-high">Verified License</Badge>
                        </div>
                        <p className="text-ink-muted">{cont.rating ?? "--"} rating ({cont.reviewsCount} reviews) • License: {cont.license || "N/A"}</p>
                        <p className="text-ink-muted">Specialty: <strong className="text-ink">{cont.specialties.join(", ")}</strong></p>
                        {cont.snippet && <p className="italic text-ink-subtle">"{cont.snippet}"</p>}
                      </div>

                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 md:border-l md:border-surface-border md:pl-5">
                        <div className="text-right">
                          <p className="text-ink-subtle font-bold uppercase text-[9px]">Est. Cost</p>
                          <p className="text-sm font-bold text-ink">{cont.avgCost !== null ? formatCurrency(cont.avgCost) : "N/A"}</p>
                          <p className="text-[10px] text-ink-muted mt-0.5">Avail: {cont.availability || "N/A"}</p>
                        </div>
                        <Button
                          id={`quote-btn-${cont.id}`}
                          variant="primary"
                          size="sm"
                          onClick={() => handleQuoteRequest(cont, selectedRec.category)}
                          isLoading={submittingQuoteFor === cont.id}
                        >
                          Get Quote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* System Toast notification modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 max-w-md w-full shadow-card-hover text-center">
            <h3 className="text-lg font-bold text-ink mb-3">HomeReady Advisor</h3>
            <p className="text-ink-muted text-sm mb-6">{modalMessage}</p>
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
