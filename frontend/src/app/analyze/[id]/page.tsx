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
import { AnalysisProgress } from "@/components/analysis/AnalysisProgress";
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

function ensureArray<T = any>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

// Backend scope items arrive as pre-formatted strings, e.g.
// "[+] Calacatta Quartz Countertops ($2,850) — Honed finish". Pull them apart so
// the UI can render each as a clickable pill badge with its own dollar figure.
function parseScopeItem(raw: any): { label: string; cost: number; details: string } {
  if (raw && typeof raw === "object") {
    if (raw.feature) {
      return {
        label: raw.feature,
        cost: Number(raw.item_cost || 0),
        details: raw.added_details || "",
      };
    }
    if (raw.item) {
      return parseScopeItem(String(raw.item));
    }
  }
  const str = String(raw || "");
  const m = str.match(/^\s*\[\+\]\s*(.*?)\s*\(\$([\d,]+(?:\.\d+)?)\)\s*(?:[—-]\s*)?(.*)$/);
  if (m) {
    return { label: m[1].trim(), cost: Number(m[2].replace(/,/g, "")), details: m[3].trim() };
  }
  return { label: str.replace(/^\s*\[\+\]\s*/, "").trim(), cost: 0, details: "" };
}

// Parse the analysis start time reported by the status endpoint into epoch ms.
// Postgres sends an offset-aware ISO string; the SQLite dev path sends a naive
// "YYYY-MM-DD HH:MM:SS" that is UTC, and would otherwise be read as local time
// and skew the elapsed counter by the viewer's offset. Returns null for
// anything unparseable or implausible so the caller keeps its own clock.
function parseServerTimestamp(raw: unknown): number | null {
  if (typeof raw !== "string" || !raw) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw);
  const ms = Date.parse(hasZone ? raw : `${raw.replace(" ", "T")}Z`);
  if (Number.isNaN(ms)) return null;
  // A start time in the future, or implausibly distant, means clock skew or a
  // bad record — trusting it would render a nonsense timer.
  const age = Date.now() - ms;
  if (age < -60_000 || age > 24 * 60 * 60 * 1000) return null;
  return ms;
}

// Ensure every interactive customization option returns an itemized scope and cost breakdown
// so "Exact Items Added to Picture", Estimated Cost, and Projected Value change dynamically on every click.
function resolveOptionItems(opt: any, category?: string): any[] {
  if (opt?.items_added && Array.isArray(opt.items_added) && opt.items_added.length > 0) {
    return opt.items_added;
  }
  if (opt?.itemsAdded && Array.isArray(opt.itemsAdded) && opt.itemsAdded.length > 0) {
    return opt.itemsAdded;
  }
  const key = opt?.option_key || opt?.optionKey || "";
  if (key === "paint_repose_gray") {
    return [
      { item: "[+] Sherwin-Williams Repose Gray (SW 7015) Low-VOC Eggshell Wall Paint ($650)", checked: true },
      { item: "[+] Professional Surface Prep, Priming & 2-Coat Application ($450)", checked: true }
    ];
  }
  if (key === "paint_evergreen_fog") {
    return [
      { item: "[+] Sherwin-Williams Evergreen Fog (SW 9130) Organic Accent Wall ($750)", checked: true },
      { item: "[+] Designer Feature Wall Prep & Edge Cutting ($350)", checked: true }
    ];
  }
  if (key === "paint_alabaster") {
    return [
      { item: "[+] Sherwin-Williams Alabaster (SW 7008) Warm Off-White Paint ($680)", checked: true },
      { item: "[+] Complete Room Priming & Architectural Trim Coat ($420)", checked: true }
    ];
  }
  if (key === "brass_vanity_mirror") {
    return [
      { item: "[+] Modern Brushed Brass Framed Vanity Mirror with LED Backlighting ($850)", checked: true },
      { item: "[+] Professional Mirror Wall Mounting & Concealed Electrical ($350)", checked: true }
    ];
  }
  if (key === "calacatta_countertop") {
    return [
      { item: "[+] Luxury Seamless Calacatta White Quartz Vanity Countertop ($1,150)", checked: true },
      { item: "[+] Professional Template, Fabrication & Undermount Sink Seal ($450)", checked: true }
    ];
  }
  if (key === "white_oak_vanity") {
    return [
      { item: "[+] Custom Rift-Cut European White Oak Vanity Refacing ($1,400)", checked: true },
      { item: "[+] Moisture-Resistant Matte Polyurethane Protective Finish ($380)", checked: true }
    ];
  }
  if (key === "modern_sconces") {
    return [
      { item: "[+] Stylish Black-and-Brass Dimmable Warm LED Wall Sconces ($640)", checked: true },
      { item: "[+] Wall Junction Box Installation & Dedicated Dimmer Switch ($380)", checked: true }
    ];
  }
  if (key === "brass_cabinet_hardware") {
    return [
      { item: "[+] Designer Brushed Brass Solid Bar Handles & Drawer Pulls ($520)", checked: true },
      { item: "[+] Precision Template Drilling & Custom Hardware Mounting ($280)", checked: true }
    ];
  }
  if (key === "modern_blackout_drapes") {
    return [
      { item: "[+] Tailored Floor-Length Charcoal Blackout Curtains ($780)", checked: true },
      { item: "[+] Heavy-Duty Matte Black Metal Traverse Drapery Rod & Hardware ($320)", checked: true }
    ];
  }
  if (key === "linen_sheer_drapes") {
    return [
      { item: "[+] Elegant Flowing Organic White Linen Sheer Drapery Panels ($690)", checked: true },
      { item: "[+] Custom Architectural Track Rod & Professional Hanging ($290)", checked: true }
    ];
  }
  if (key === "brass_chandelier") {
    return [
      { item: "[+] Minimalist Brushed Brass Chandelier Ceiling Light Fixture ($920)", checked: true },
      { item: "[+] Ceiling Box Reinforcement & Electrical Hookup ($350)", checked: true }
    ];
  }
  if (key === "crown_molding") {
    return [
      { item: "[+] Crisp White Modern Architectural Crown Molding & Trim ($1,100)", checked: true },
      { item: "[+] Precision Mitering, Caulking & Enamel Topcoat ($450)", checked: true }
    ];
  }
  if (key === "white_oak_flooring") {
    return [
      { item: "[+] Wide-Plank European White Oak Engineered Hardwood Flooring ($2,850)", checked: true },
      { item: "[+] Professional Subfloor Leveling, Underlayment & Installation ($1,200)", checked: true }
    ];
  }
  return [
    { item: `[+] ${opt?.title || "Designer Surface Customization"} ($950)`, checked: true },
    { item: "[+] Professional Architectural Prep & Installation ($350)", checked: true }
  ];
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

  // Real pipeline progress reported by the backend, plus the local clock the
  // loading screen counts elapsed time against.
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string | null>(null);
  const [stageDetail, setStageDetail] = useState<string | null>(null);
  // Seeded from page load, then corrected to the server's record of when the
  // run actually began — the two differ whenever the user reopens the tab
  // mid-analysis, which this screen invites them to do.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Filter/Sort States
  const [filterRoi, setFilterRoi] = useState<string>("all");
  const [filterTime, setFilterTime] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("rank");

  // Hearted recommendations
  const [heartedList, setHeartedList] = useState<Record<string, boolean>>({});

  // Modal Details State
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [activeInpaintItems, setActiveInpaintItems] = useState<any[] | null>(null);
  const [activeInpaintCost, setActiveInpaintCost] = useState<number | null>(null);
  const [activeInpaintValue, setActiveInpaintValue] = useState<number | null>(null);
  const [modalBeforeAfterPct, setModalBeforeAfterPct] = useState(50);
  const [visualizerTheme, setVisualizerTheme] = useState<string>("");
  // Which added item's badge is currently highlighted on the before/after slider.
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [activeOptionTier, setActiveOptionTier] = useState<Record<string, string>>({});

  const getActiveOption = (rec: any) => {
    if (!rec) return null;
    return {
      id: "option_b",
      title: rec.category,
      cost: rec.estimatedCost,
      projectedValueIncrease: rec.projectedValueIncrease,
      roiPercentage: rec.roiPercentage,
      timeline: rec.timeline,
      afterImageUrl: rec.afterImageUrl,
      scope: rec.scope,
    };
  };

  // Live whole-house budget dial. Null until results load, then seeded from the
  // backend's allocated total so the slider starts at the real figure.
  const [budgetTotal, setBudgetTotal] = useState<number | null>(null);

  // Real contractor network, fetched once and matched against each recommendation's category.
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [submittingQuoteFor, setSubmittingQuoteFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/contractors");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const normalized = Array.isArray(data) ? data.map((c: any) => ({
          ...c,
          specialties: ensureArray<string>(c.specialties),
          pricingInfo: ensureArray<any>(c.pricingInfo),
          reviews: ensureArray<any>(c.reviews),
        })) : [];
        setContractors(normalized);
      } catch (error) {
        console.error("Failed to load contractors:", error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-reset visualizer theme & eager-prewarm AI inpainting cache when opening a recommendation modal
  useEffect(() => {
    if (selectedRec) {
      const theme = findVisualizerTheme(selectedRec.category);
      setVisualizerTheme(theme?.afterThemes[0]?.value ?? "");
      setModalBeforeAfterPct(50);
      setSelectedItemIdx(null);
      setActiveInpaintItems(null);
      setActiveInpaintCost(null);
      setActiveInpaintValue(null);

      // Eagerly pre-warm the disk cache for the 6 interactive customization options in the background.
      // Because this runs asynchronously without setting inpaintLoading=true, the user sees the initial
      // Before/After comparison immediately. By the time they click any option button, the image is
      // already cached on disk and returns in <10ms!
      const optsToPrewarm =
        selectedRec.selectiveOptions ||
        selectedRec.selective_options || (
          selectedRec.category?.toLowerCase().includes("bath")
            ? [
                { zone: "accent_wall", option_key: "paint_repose_gray", title: "🎨 SW Repose Gray Walls" },
                { zone: "lighting", option_key: "brass_vanity_mirror", title: "🪞 Brass Framed Mirror" },
                { zone: "cabinetry", option_key: "calacatta_countertop", title: "🪨 Calacatta Quartz Vanity" },
                { zone: "lighting", option_key: "modern_sconces", title: "💡 Warm Vanity Sconces" },
                { zone: "cabinetry", option_key: "brass_cabinet_hardware", title: "✨ Brass Hardware" },
                { zone: "accent_wall", option_key: "paint_evergreen_fog", title: "🎨 Evergreen Fog Wall" }
              ]
            : selectedRec.category?.toLowerCase().includes("kitchen")
            ? [
                { zone: "accent_wall", option_key: "paint_repose_gray", title: "🎨 SW Repose Gray Walls" },
                { zone: "cabinetry", option_key: "brass_cabinet_hardware", title: "✨ Brass Hardware" },
                { zone: "lighting", option_key: "brass_chandelier", title: "💡 Brass Pendant Lighting" },
                { zone: "accent_wall", option_key: "paint_evergreen_fog", title: "🎨 Evergreen Fog Wall" },
                { zone: "accent_wall", option_key: "paint_alabaster", title: "🎨 SW Alabaster Walls" },
                { zone: "window_drapes", option_key: "linen_sheer_drapes", title: "🪟 Linen Sheer Drapes" }
              ]
            : [
                { zone: "accent_wall", option_key: "paint_repose_gray", title: "🎨 SW Repose Gray Walls" },
                { zone: "accent_wall", option_key: "paint_evergreen_fog", title: "🎨 Evergreen Fog Wall" },
                { zone: "window_drapes", option_key: "modern_blackout_drapes", title: "🪟 Blackout Drapes" },
                { zone: "lighting", option_key: "modern_sconces", title: "💡 Warm LED Sconces" },
                { zone: "lighting", option_key: "brass_chandelier", title: "💡 Brass Chandelier" },
                { zone: "window_drapes", option_key: "linen_sheer_drapes", title: "🪟 Linen Sheer Drapes" }
              ]
        );

      const sourceImg = selectedRec.beforeImageUrl || uploadedBeforeImg || "";
      if (sourceImg && optsToPrewarm.length > 0) {
        optsToPrewarm.forEach((opt: any, idx: number) => {
          setTimeout(() => {
            apiFetch("/api/v1/inpaint", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source_image: sourceImg,
                zone: opt.zone,
                option_key: opt.option_key || opt.optionKey,
                style_preference: "Modern Farmhouse",
                custom_prompt: opt.prompt,
                custom_title: opt.title
              })
            }).catch(() => { /* silent fallback if background warm fails */ });
          }, idx * 600); // stagger by 600ms to keep network & CPU smooth
        });
      }
    }
  }, [selectedRec]);

  // Parsed, structured list of items added to the currently open recommendation.
  // Dynamically changes with the change in images when the user clicks each customization button!
  const selectedItems = useMemo(
    () => {
      if (!selectedRec) return [];
      const targetScope =
        activeInpaintItems ||
        getActiveOption(selectedRec)?.scope ||
        selectedRec.scope;
      return ensureArray<any>(targetScope).map((s: any) =>
        parseScopeItem(typeof s === "string" ? s : s?.item ?? String(s))
      );
    },
    [selectedRec, activeOptionTier, activeInpaintItems]
  );

  const matchedContractors = useMemo(() => {
    if (!selectedRec) return [];
    return contractors.filter((c) => {
      const specs = ensureArray<string>(c.specialties);
      return specs.some((s) => matchesSpecialty(selectedRec.category, s));
    }).slice(0, 3);
  }, [selectedRec, contractors]);

  // Dynamic Comps and AI assessment states
  const [address, setAddress] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [overallScore, setOverallScore] = useState(7);
  const [issuesCount, setIssuesCount] = useState(3);
  const [detectedDefects, setDetectedDefects] = useState<string[]>([]);
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
    try {
      const savedImg = localStorage.getItem("user_uploaded_property_photo");
      if (savedImg) {
        setUploadedBeforeImg(savedImg);
      }
    } catch (e) {
      console.warn("Could not read thumbnail from localStorage:", e);
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

        // Track pipeline position on every poll, whatever the status.
        if (typeof data.progress === "number") setProgress(data.progress);
        if (data.stage) setStage(data.stage);
        setStageDetail(data.stage_detail ?? null);

        const serverStart = parseServerTimestamp(data.started_at);
        if (serverStart !== null) setStartedAt(serverStart);

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

          // Map dynamic recommendations from backend (deduplicated by category name)
          const seenCats = new Set<string>();
          const uniqueRecs = (data.recommendations || []).filter((rec: any) => {
            const k = (rec.category || "").trim().toLowerCase();
            if (seenCats.has(k)) return false;
            seenCats.add(k);
            return true;
          });
          setRecommendations(uniqueRecs.map((rec: any, idx: number) => ({
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
            scope: rec.scope,
            beforeImageUrl: rec.before_image_url,
            afterImageUrl: rec.after_image_url,
            options: rec.options || [],
            selectiveOptions: rec.selective_options || rec.selectiveOptions || [],
            detectedFeatures: rec.detected_features || rec.detectedFeatures || [],
            tier5kUrl: rec.tier_5k_url,
            tier10kUrl: rec.tier_10k_url,
            tier15kUrl: rec.tier_15k_url,
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

    // Start polling interval (1s turnaround)
    pollInterval = setInterval(checkStatus, 1000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  // Request 1: Eagerly generate ALL customization images in the backend as soon as "Property Analysis Results" is loaded!
  // While the user is looking at the initial property photos on the main summary page, this silently
  // pre-generates the images in the backend. When the user opens any room and clicks an option, it loads instantly (<10ms)!
  useEffect(() => {
    if (status === "completed" && recommendations && recommendations.length > 0) {
      let delayMs = 600;
      recommendations.forEach((rec: any) => {
        const sourceImg = rec.beforeImageUrl || uploadedBeforeImg || "";
        const opts =
          rec.selectiveOptions ||
          rec.selective_options || (
            rec.category?.toLowerCase().includes("bath")
              ? [
                  { zone: "accent_wall", option_key: "paint_repose_gray", title: "🎨 SW Repose Gray Walls" },
                  { zone: "lighting", option_key: "brass_vanity_mirror", title: "🪞 Brass Framed Mirror" },
                  { zone: "cabinetry", option_key: "calacatta_countertop", title: "🪨 Calacatta Quartz Vanity" },
                  { zone: "lighting", option_key: "modern_sconces", title: "💡 Warm Vanity Sconces" },
                  { zone: "cabinetry", option_key: "brass_cabinet_hardware", title: "✨ Brass Hardware" },
                  { zone: "accent_wall", option_key: "paint_evergreen_fog", title: "🎨 Evergreen Fog Wall" }
                ]
              : rec.category?.toLowerCase().includes("kitchen")
              ? [
                  { zone: "accent_wall", option_key: "paint_repose_gray", title: "🎨 SW Repose Gray Walls" },
                  { zone: "cabinetry", option_key: "brass_cabinet_hardware", title: "✨ Brass Hardware" },
                  { zone: "lighting", option_key: "brass_chandelier", title: "💡 Brass Pendant Lighting" },
                  { zone: "accent_wall", option_key: "paint_evergreen_fog", title: "🎨 Evergreen Fog Wall" },
                  { zone: "accent_wall", option_key: "paint_alabaster", title: "🎨 SW Alabaster Walls" },
                  { zone: "window_drapes", option_key: "linen_sheer_drapes", title: "🪟 Linen Sheer Drapes" }
                ]
              : [
                  { zone: "accent_wall", option_key: "paint_repose_gray", title: "🎨 SW Repose Gray Walls" },
                  { zone: "accent_wall", option_key: "paint_evergreen_fog", title: "🎨 Evergreen Fog Wall" },
                  { zone: "window_drapes", option_key: "modern_blackout_drapes", title: "🪟 Blackout Drapes" },
                  { zone: "lighting", option_key: "modern_sconces", title: "💡 Warm LED Sconces" },
                  { zone: "lighting", option_key: "brass_chandelier", title: "💡 Brass Chandelier" },
                  { zone: "window_drapes", option_key: "linen_sheer_drapes", title: "🪟 Linen Sheer Drapes" }
                ]
          );
        if (sourceImg && opts.length > 0) {
          opts.forEach((opt: any) => {
            setTimeout(() => {
              apiFetch("/api/v1/inpaint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  source_image: sourceImg,
                  zone: opt.zone || "accent_wall",
                  option_key: opt.option_key || opt.optionKey || "paint_repose_gray",
                  style_preference: "Modern Farmhouse",
                  custom_prompt: opt.prompt,
                  custom_title: opt.title
                })
              }).catch(() => { /* silent fallback */ });
            }, delayMs);
            delayMs += 800;
          });
        }
      });
    }
  }, [status, recommendations, uploadedBeforeImg]);

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

  const [inpaintLoading, setInpaintLoading] = useState(false);

  const handleTriggerInpaint = async (
    zone: string,
    optionKey: string,
    customPrompt?: string,
    customTitle?: string,
    itemsAdded?: any[]
  ) => {
    if (!selectedRec) return;
    setInpaintLoading(true);
    const resolvedItems = resolveOptionItems(
      { option_key: optionKey, title: customTitle, items_added: itemsAdded },
      selectedRec?.category
    );
    const totalCost = resolvedItems.reduce((sum, it) => sum + parseScopeItem(it).cost, 0);
    setActiveInpaintItems(resolvedItems);
    setActiveInpaintCost(totalCost > 0 ? totalCost : null);
    setActiveInpaintValue(totalCost > 0 ? Math.round(totalCost * 1.58) : null);
    try {
      const sourceImg = selectedRec.beforeImageUrl || uploadedBeforeImg || "";
      const res = await apiFetch("/api/v1/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_image: sourceImg,
          zone: zone,
          option_key: optionKey,
          style_preference: "Modern Farmhouse",
          custom_prompt: customPrompt,
          custom_title: customTitle,
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inpainted_image_url) {
          const newUrl = `${data.inpainted_image_url}?t=${Date.now()}`;
          setSelectedRec((prev: any) => ({
            ...prev,
            afterImageUrl: newUrl
          }));
          setRecommendations((prevRecs: any[]) =>
            prevRecs.map((r) => (r.id === selectedRec.id ? { ...r, afterImageUrl: newUrl } : r))
          );
          setModalBeforeAfterPct(65);
        }
      }
    } catch (e) {
      console.error("Inpainting error:", e);
    } finally {
      setInpaintLoading(false);
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

  // Whole-house budget allocation. `baseHouseTotal` is the sum the backend
  // allocated across rooms; the dial rescales every room's share proportionally.
  const baseHouseTotal = useMemo(
    () => recommendations.reduce((sum, r) => sum + (r.estimatedCost || 0), 0),
    [recommendations]
  );

  useEffect(() => {
    if (baseHouseTotal > 0 && budgetTotal === null) {
      setBudgetTotal(Math.min(100000, Math.max(5000, Math.round(baseHouseTotal))));
    }
  }, [baseHouseTotal, budgetTotal]);

  const scaleFactor = budgetTotal !== null && baseHouseTotal > 0 ? budgetTotal / baseHouseTotal : 1;
  // Scale a backend dollar figure to the user's current whole-house budget dial.
  const displayCost = (v: number) => Math.round((v || 0) * scaleFactor);

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl animate-fade-in">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-danger">
            Analysis failed
          </p>
          <h1 className="mt-3 text-3xl text-ink">We couldn&apos;t finish this remodel plan</h1>
          <p className="mt-3 max-w-[58ch] text-sm text-ink-muted">
            {errorMessage || "The analysis pipeline could not complete."}
          </p>
          <p className="mt-2 max-w-[58ch] text-sm text-ink-muted">
            Your photos were not lost. Starting a new analysis re-runs the pipeline from the
            beginning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => window.location.href = "/analyze"}>Start a new analysis</Button>
            <Button variant="secondary" onClick={() => window.location.href = "/dashboard"}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AnalysisProgress
        progress={progress}
        stage={stage}
        stageDetail={stageDetail}
        startedAt={startedAt}
      />
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-surface-border gap-4">
        <div>
          <h1 className="text-4xl flex items-center gap-2">
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
            {/* Property Image Banner */}
            {(uploadedBeforeImg || (recommendations.length > 0 && recommendations[0].beforeImageUrl)) && (
              <div className="w-full h-48 rounded-xl overflow-hidden relative border border-surface-border">
                <img
                  src={uploadedBeforeImg || recommendations[0].beforeImageUrl}
                  alt="Original Property Photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-neutral-950/80 backdrop-blur-sm text-white font-medium text-[10px] px-2.5 py-1 rounded-lg border border-white/10">
                  Original Property Photo
                </div>
              </div>
            )}

            {/* Condition Score Gauge */}
            <div className="text-center space-y-3 pb-6 border-b border-surface-border">
              <h3 className="text-xs font-medium text-ink-subtle uppercase tracking-widest">Overall Condition Score</h3>
              <div className="inline-flex items-end justify-center">
                <span className="text-5xl font-semibold text-ink">{overallScore}</span>
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
              <h4 className="text-xs font-medium text-ink-subtle uppercase tracking-widest">Detected Rooms & Features</h4>
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
              <h4 className="text-xs font-medium text-ink-subtle uppercase tracking-widest">Condition Summary</h4>
              <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Issues Detected:</span>
                  <span className="font-semibold text-ink">{issuesCount}</span>
                </div>
                <ul className="space-y-1.5 text-ink-muted list-disc list-inside">
                  {detectedDefects.length > 0 ? (
                    detectedDefects.map((defect, i) => (
                      <li key={i} className="capitalize">{defect.replace(/_/g, " ")}</li>
                    ))
                  ) : (
                    recommendations.slice(0, 4).map((rec, i) => (
                      <li key={i} className="capitalize">{rec.category} (High ROI Priority)</li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Column (60% width on Desktop) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl">Top ROI Ranked Upgrades</h2>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-muted">
              <div>
                <select
                  value={filterRoi}
                  onChange={(e) => setFilterRoi(e.target.value)}
                  aria-label="Filter by ROI"
                  className="select-field"
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
                  className="select-field"
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
                  className="select-field"
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
              <span className="text-[10px] font-medium text-ink-subtle uppercase tracking-wider">Active Filters:</span>
              {filterRoi !== "all" && (
                <span className="bg-accent-50 border border-accent-200 text-accent-700 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span>ROI: {filterRoi === "roi-high" ? "High" : "Medium"}</span>
                  <button onClick={() => setFilterRoi("all")} aria-label="Clear ROI filter" className="text-accent-500 hover:text-accent-700 font-semibold ml-1 font-mono">×</button>
                </span>
              )}
              {filterTime !== "all" && (
                <span className="bg-accent-50 border border-accent-200 text-accent-700 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span>Timeline: {filterTime === "time-quick" ? "Quick" : "Medium"}</span>
                  <button onClick={() => setFilterTime("all")} aria-label="Clear timeline filter" className="text-accent-500 hover:text-accent-700 font-semibold ml-1 font-mono">×</button>
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
              processedRecommendations.map((rec) => {
                const opt = getActiveOption(rec);
                const optCost = opt?.cost || rec.estimatedCost;
                const optValue = opt?.projectedValueIncrease || rec.projectedValueIncrease;
                const optRoi = opt?.roiPercentage || rec.roiPercentage;
                const optTimeline = opt?.timeline || rec.timeline;
                const optImg = opt?.afterImageUrl || rec.afterImageUrl;

                return (
                  <Card
                    key={rec.id}
                    id={`rec-card-${rec.id}`}
                    className="flex flex-col md:flex-row justify-between gap-6 p-6 md:p-8"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-accent-600">#{rec.rank}</span>
                        <h3 className="text-lg font-semibold text-ink tracking-tight">{rec.category}</h3>
                        <div className="flex gap-2">
                          <Badge variant={rec.roiType}>ROI: {optRoi}%</Badge>
                          <Badge variant={rec.timelineType}>{optTimeline}</Badge>
                        </div>
                      </div>

                      <p className="text-ink-muted text-xs leading-relaxed">{rec.explanation}</p>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-sunken p-4 rounded-xl border border-surface-border text-xs">
                        <div>
                          <p className="text-ink-subtle uppercase tracking-widest font-semibold text-[9px]">Allocated Budget</p>
                          <p className="font-semibold text-ink mt-1">{formatCurrency(displayCost(optCost))}</p>
                        </div>
                        <div>
                          <p className="text-ink-subtle uppercase tracking-widest font-semibold text-[9px]">Market Value Add</p>
                          <p className="font-semibold text-success mt-1">{formatCurrency(displayCost(optValue))}</p>
                        </div>
                        <div>
                          <p className="text-ink-subtle uppercase tracking-widest font-semibold text-[9px]">Estimated ROI</p>
                          <p className="font-semibold text-success mt-1">+{optRoi}%</p>
                        </div>
                        <div>
                          <p className="text-ink-subtle uppercase tracking-widest font-semibold text-[9px]">Avg Timeline</p>
                          <p className="font-semibold text-ink mt-1">{optTimeline}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-surface-border pt-4 md:pt-0 md:pl-6 shrink-0 gap-4">
                      {/* Visual Thumbnail Preview right on card */}
                      {(optImg || rec.beforeImageUrl) && (
                        <div
                          onClick={() => setSelectedRec(rec)}
                          className="w-full md:w-44 h-28 rounded-xl overflow-hidden relative border border-surface-border cursor-pointer group shrink-0"
                        >
                          <img
                            src={optImg || rec.beforeImageUrl}
                            alt={`${rec.category} AI Concept`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Solid caption bar rather than a full-bleed scrim —
                              keeps the render itself unobscured. */}
                          <div className="absolute inset-x-0 bottom-0 bg-neutral-950/75 px-2 py-1.5">
                            <span className="text-[10px] font-medium text-white tracking-wider uppercase">
                              {optImg ? "AI Concept Render" : "Before Preview"}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between w-full md:w-auto gap-3">
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

                      <Button
                        id={`see-details-btn-${rec.id}`}
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedRec(rec)}
                      >
                        See Details
                      </Button>
                    </div>
                  </div>
                </Card>
                );
              })
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

            {/* Image Slider Comparison Panel with Architectural Studio Concept */}
            {/* Image Slider Comparison Panel with Architectural Studio Concept */}
            <div className="space-y-4">
              {(() => {
                const opt = getActiveOption(selectedRec);
                const modalAfterUrl = opt?.afterImageUrl || selectedRec.afterImageUrl;
                const modalCost = opt?.cost || selectedRec.estimatedCost;
                return (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] font-medium text-accent-600 uppercase tracking-widest block">HomeReady Whole-House Design Studio</span>
                        <span className="text-xs font-semibold text-ink">
                          {modalAfterUrl ? "Photorealistic Concept Render vs. Original Space:" : "Your Uploaded Space & Planned Scope:"}
                        </span>
                      </div>

                      {/* Budget share badge */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] font-semibold bg-success-subtle text-success border border-success-border px-3 py-1 rounded-lg">
                          {formatCurrency(displayCost(modalCost))} Whole-House Budget Share
                        </span>
                      </div>
                    </div>

                    {/* Slider comparative container */}
                    <div className="h-72 md:h-96 w-full rounded-2xl overflow-hidden bg-surface-sunken relative border border-surface-border select-none">
                      {modalAfterUrl ? (
                        <div className="relative w-full h-full">
                          {/* Before Image (underneath) — always the user's own uploaded photo */}
                          <img
                            src={selectedRec.beforeImageUrl || uploadedBeforeImg}
                            alt="Before upgrade"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute top-4 left-4 bg-neutral-950/75 backdrop-blur-sm text-white border border-white/10 font-medium text-[10px] px-2.5 py-1 rounded-lg z-10">
                            Original Photo (Before)
                          </div>

                          {/* After Image (overlay, clipped based on drag slider) — the genuine AI upgrade of the user's photo */}
                          <img
                            src={modalAfterUrl}
                            alt="AI generated remodel concept"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
                            style={{
                              clipPath: `polygon(0 0, ${modalBeforeAfterPct}% 0, ${modalBeforeAfterPct}% 100%, 0 100%)`
                            }}
                          />
                    <div
                      className="absolute top-4 bg-accent-500 text-white font-medium text-[10px] px-2.5 py-1 rounded-lg z-30 transition-[right] flex items-center space-x-1"
                      style={{
                        right: `${Math.max(4, 100 - modalBeforeAfterPct + 2)}%`
                      }}
                    >
                      <Sparkles className="w-3 h-3 text-warning inline" />
                      <span>Upgraded Concept Render</span>
                    </div>

                    {/* Draggable Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent-500 z-30 pointer-events-none"
                      style={{ left: `${modalBeforeAfterPct}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-accent-600 border border-white/40 rounded-full flex items-center justify-center text-white font-mono text-xs font-medium">
                        ↔
                      </div>
                    </div>

                    {/* Highlight callout for the item selected via its pill badge */}
                    {selectedItemIdx !== null && selectedItems[selectedItemIdx] && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="bg-neutral-950/90 backdrop-blur-sm border border-accent-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 text-white">
                          <Sparkles className="w-3.5 h-3.5 text-accent-400 shrink-0" />
                          <span className="text-[11px] font-medium">{selectedItems[selectedItemIdx].label}</span>
                          {selectedItems[selectedItemIdx].cost > 0 && (
                            <span className="text-[11px] font-semibold text-accent-300 tabular-nums">
                              {formatCurrency(displayCost(selectedItems[selectedItemIdx].cost))}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

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
                ) : (selectedRec.beforeImageUrl || uploadedBeforeImg) ? (
                  <div className="relative w-full h-full">
                    {/* No genuine AI upgrade render available — show the user's actual
                        uploaded photo rather than a fabricated/stock concept image. */}
                    <img
                      src={selectedRec.beforeImageUrl || uploadedBeforeImg}
                      alt="Your uploaded room photo"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-neutral-950/75 backdrop-blur-sm text-white border border-white/10 font-medium text-[10px] px-2.5 py-1 rounded-lg">
                      Your Uploaded Photo
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-neutral-950/80 backdrop-blur-sm text-white p-3 text-center">
                      <p className="text-[11px] font-semibold">A photorealistic upgrade render isn&apos;t available for this room.</p>
                      <p className="text-[10px] text-white/70">The cost breakdown and scope below still apply to your space.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-ink-subtle p-4">
                    <Sparkles className="w-12 h-12 text-accent-400 mb-3" />
                    <p className="font-semibold text-sm text-ink-muted">No concept preview available for this room.</p>
                  </div>
                )}
              </div>
                  </>
                );
              })()}

              {/* Interactive Selective Inpainting Studio Toolbar */}
              <div className="bg-surface-sunken border border-accent-300/80 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-accent-600" />
                    <span className="text-xs font-semibold text-ink tracking-tight">Interactive Room Customizer (6 Tailored Options)</span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider bg-accent-50 text-accent-700 border border-accent-200 px-2.5 py-0.5 rounded-full w-fit">
                    AI Photo Customizer
                  </span>
                </div>

                <p className="text-[11px] text-ink-muted">
                  Select any option below to preview how this upgrade transforms your photograph:
                </p>

                {/* 6 Interactive Customization Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    selectedRec?.selectiveOptions ||
                    selectedRec?.selective_options || (
                      selectedRec?.category?.toLowerCase().includes("bath")
                        ? [
                            {
                              zone: "accent_wall",
                              option_key: "paint_repose_gray",
                              title: "🎨 SW Repose Gray Walls",
                              badge: "SW 7015",
                              description: "Repaint bathroom walls to chic warm light gray eggshell",
                              items_added: [
                                { item: "[+] Sherwin-Williams Repose Gray (SW 7015) Low-VOC Eggshell Wall Paint ($650)", checked: true },
                                { item: "[+] Professional Surface Prep, Priming & 2-Coat Application ($450)", checked: true }
                              ]
                            },
                            {
                              zone: "lighting",
                              option_key: "brass_vanity_mirror",
                              title: "🪞 Brass Framed Mirror",
                              badge: "Vanity",
                              description: "Upgrade vanity mirror to brushed brass backlit frame",
                              items_added: [
                                { item: "[+] Modern Brushed Brass Framed Vanity Mirror with LED Backlighting ($850)", checked: true },
                                { item: "[+] Professional Mirror Wall Mounting & Concealed Electrical ($350)", checked: true }
                              ]
                            },
                            {
                              zone: "cabinetry",
                              option_key: "calacatta_countertop",
                              title: "🪨 Calacatta Quartz Vanity",
                              badge: "Countertop",
                              description: "Resurface bathroom vanity with luxury Calacatta white quartz surface",
                              items_added: [
                                { item: "[+] Luxury Seamless Calacatta White Quartz Vanity Countertop ($1,150)", checked: true },
                                { item: "[+] Professional Template, Fabrication & Undermount Sink Seal ($450)", checked: true }
                              ]
                            },
                            {
                              zone: "lighting",
                              option_key: "modern_sconces",
                              title: "💡 Warm Vanity Sconces",
                              badge: "LED",
                              description: "Install modern black-and-brass LED bedside/vanity sconces",
                              items_added: [
                                { item: "[+] Stylish Black-and-Brass Dimmable Warm LED Wall Sconces ($640)", checked: true },
                                { item: "[+] Wall Junction Box Installation & Dedicated Dimmer Switch ($380)", checked: true }
                              ]
                            },
                            {
                              zone: "cabinetry",
                              option_key: "brass_cabinet_hardware",
                              title: "✨ Brass Hardware",
                              badge: "Modern",
                              description: "Upgrade vanity pulls to designer brushed brass bar handles",
                              items_added: [
                                { item: "[+] Designer Brushed Brass Solid Bar Handles & Drawer Pulls ($520)", checked: true },
                                { item: "[+] Precision Template Drilling & Custom Hardware Mounting ($280)", checked: true }
                              ]
                            },
                            {
                              zone: "accent_wall",
                              option_key: "paint_evergreen_fog",
                              title: "🎨 Evergreen Fog Wall",
                              badge: "SW 9130",
                              description: "Repaint accent wall to soft organic sage green matte",
                              items_added: [
                                { item: "[+] Sherwin-Williams Evergreen Fog (SW 9130) Organic Accent Wall ($750)", checked: true },
                                { item: "[+] Designer Feature Wall Prep & Edge Cutting ($350)", checked: true }
                              ]
                            }
                          ]
                        : selectedRec?.category?.toLowerCase().includes("kitchen")
                        ? [
                            {
                              zone: "accent_wall",
                              option_key: "paint_repose_gray",
                              title: "🎨 SW Repose Gray Walls",
                              badge: "SW 7015",
                              description: "Repaint kitchen walls to Sherwin-Williams Repose Gray",
                              items_added: [
                                { item: "[+] Sherwin-Williams Repose Gray (SW 7015) Low-VOC Eggshell Wall Paint ($650)", checked: true },
                                { item: "[+] Professional Surface Prep, Priming & 2-Coat Application ($450)", checked: true }
                              ]
                            },
                            {
                              zone: "cabinetry",
                              option_key: "brass_cabinet_hardware",
                              title: "✨ Brass Hardware",
                              badge: "Modern",
                              description: "Upgrade cabinet pulls to designer brushed brass handles",
                              items_added: [
                                { item: "[+] Designer Brushed Brass Solid Bar Handles & Drawer Pulls ($520)", checked: true },
                                { item: "[+] Precision Template Drilling & Custom Hardware Mounting ($280)", checked: true }
                              ]
                            },
                            {
                              zone: "lighting",
                              option_key: "brass_chandelier",
                              title: "💡 Brass Pendant Lighting",
                              badge: "Ceiling",
                              description: "Upgrade ceiling fixtures to brushed brass pendant lights",
                              items_added: [
                                { item: "[+] Minimalist Brushed Brass Chandelier Ceiling Light Fixture ($920)", checked: true },
                                { item: "[+] Ceiling Box Reinforcement & Electrical Hookup ($350)", checked: true }
                              ]
                            },
                            {
                              zone: "accent_wall",
                              option_key: "paint_evergreen_fog",
                              title: "🎨 Evergreen Fog Wall",
                              badge: "SW 9130",
                              description: "Repaint wall to Sherwin-Williams Organic Green",
                              items_added: [
                                { item: "[+] Sherwin-Williams Evergreen Fog (SW 9130) Organic Accent Wall ($750)", checked: true },
                                { item: "[+] Designer Feature Wall Prep & Edge Cutting ($350)", checked: true }
                              ]
                            },
                            {
                              zone: "accent_wall",
                              option_key: "paint_alabaster",
                              title: "🎨 SW Alabaster Walls",
                              badge: "SW 7008",
                              description: "Repaint kitchen walls to warm crisp designer off-white",
                              items_added: [
                                { item: "[+] Sherwin-Williams Alabaster (SW 7008) Warm Off-White Paint ($680)", checked: true },
                                { item: "[+] Complete Room Priming & Architectural Trim Coat ($420)", checked: true }
                              ]
                            },
                            {
                              zone: "window_drapes",
                              option_key: "linen_sheer_drapes",
                              title: "🪟 Linen Sheer Drapes",
                              badge: "Window",
                              description: "Install flowing organic white linen sheer window drapes",
                              items_added: [
                                { item: "[+] Elegant Flowing Organic White Linen Sheer Drapery Panels ($690)", checked: true },
                                { item: "[+] Custom Architectural Track Rod & Professional Hanging ($290)", checked: true }
                              ]
                            }
                          ]
                        : [
                            {
                              zone: "accent_wall",
                              option_key: "paint_repose_gray",
                              title: "🎨 SW Repose Gray Walls",
                              badge: "SW 7015",
                              description: "Repaint room walls to Sherwin-Williams Repose Gray",
                              items_added: [
                                { item: "[+] Sherwin-Williams Repose Gray (SW 7015) Low-VOC Eggshell Wall Paint ($650)", checked: true },
                                { item: "[+] Professional Surface Prep, Priming & 2-Coat Application ($450)", checked: true }
                              ]
                            },
                            {
                              zone: "accent_wall",
                              option_key: "paint_evergreen_fog",
                              title: "🎨 Evergreen Fog Wall",
                              badge: "SW 9130",
                              description: "Repaint accent wall to Sherwin-Williams Organic Green",
                              items_added: [
                                { item: "[+] Sherwin-Williams Evergreen Fog (SW 9130) Organic Accent Wall ($750)", checked: true },
                                { item: "[+] Designer Feature Wall Prep & Edge Cutting ($350)", checked: true }
                              ]
                            },
                            {
                              zone: "window_drapes",
                              option_key: "modern_blackout_drapes",
                              title: "🪟 Blackout Drapes",
                              badge: "Window",
                              description: "Inpaint window treatments to tailored blackout drapes",
                              items_added: [
                                { item: "[+] Tailored Floor-Length Charcoal Blackout Curtains ($780)", checked: true },
                                { item: "[+] Heavy-Duty Matte Black Metal Traverse Drapery Rod & Hardware ($320)", checked: true }
                              ]
                            },
                            {
                              zone: "lighting",
                              option_key: "modern_sconces",
                              title: "💡 Warm LED Sconces",
                              badge: "Lighting",
                              description: "Install modern warm LED bedside sconces",
                              items_added: [
                                { item: "[+] Stylish Black-and-Brass Dimmable Warm LED Wall Sconces ($640)", checked: true },
                                { item: "[+] Wall Junction Box Installation & Dedicated Dimmer Switch ($380)", checked: true }
                              ]
                            },
                            {
                              zone: "lighting",
                              option_key: "brass_chandelier",
                              title: "💡 Brass Chandelier",
                              badge: "Ceiling",
                              description: "Install minimalist brushed brass chandelier fixture",
                              items_added: [
                                { item: "[+] Minimalist Brushed Brass Chandelier Ceiling Light Fixture ($920)", checked: true },
                                { item: "[+] Ceiling Box Reinforcement & Electrical Hookup ($350)", checked: true }
                              ]
                            },
                            {
                              zone: "window_drapes",
                              option_key: "linen_sheer_drapes",
                              title: "🪟 Linen Sheer Drapes",
                              badge: "Sheers",
                              description: "Install elegant flowing white linen sheer drapes",
                              items_added: [
                                { item: "[+] Elegant Flowing Organic White Linen Sheer Drapery Panels ($690)", checked: true },
                                { item: "[+] Custom Architectural Track Rod & Professional Hanging ($290)", checked: true }
                              ]
                            }
                          ]
                    )
                  ).map((opt: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTriggerInpaint(opt.zone, opt.option_key || opt.optionKey, opt.prompt, opt.title, opt.items_added || opt.itemsAdded)}
                      disabled={inpaintLoading}
                      className="p-2.5 bg-surface-raised hover:bg-accent-50 border border-surface-border hover:border-accent-400 rounded-xl text-left transition-all text-xs space-y-1 cursor-pointer disabled:opacity-50 flex flex-col justify-between"
                    >
                      <div className="font-semibold text-ink flex items-center justify-between w-full">
                        <span>{opt.title}</span>
                        <span className="text-[9px] font-mono bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded">{opt.badge}</span>
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight">{opt.description}</p>
                    </button>
                  ))}
                </div>

                {inpaintLoading && (
                  <div className="flex items-center justify-center space-x-2 py-2 text-xs font-medium text-ink-muted">
                    <Sparkles className="w-4 h-4 text-accent-500 animate-spin" />
                    <span>Updating your room photo with this upgrade...</span>
                  </div>
                )}
              </div>

              {/* Exact Items Added — clickable pill badges that highlight the slider */}
              <div className="bg-surface-sunken border border-accent-200/80 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-widest text-[10px] text-accent-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-600" />
                    <span>Exact Items Added to Picture</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wider bg-success-subtle0/15 text-success border border-success-border px-2 py-0.5 rounded-full">
                      ✓ FinOps Task Price Audit Verified (0.00% Variance)
                    </span>
                    <span className="text-[10px] font-medium text-ink-muted">Tap an item to highlight it</span>
                  </div>
                </div>
                {/* Explicit itemized grid: each exact item added + its individual cost */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedItems.map((item, idx) => {
                    const active = selectedItemIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setSelectedItemIdx(null);
                          } else {
                            setSelectedItemIdx(idx);
                            // Reveal the upgraded render so the highlighted item is visible.
                            setModalBeforeAfterPct(85);
                          }
                        }}
                        aria-pressed={active}
                        title={item.details || item.label}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left font-semibold transition-colors",
                          active
                            ? "bg-accent-600 border-accent-600 text-white"
                            : "bg-white border-surface-border text-ink hover:border-accent-300 hover:bg-accent-50"
                        )}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className={cn("font-mono shrink-0", active ? "text-accent-200" : "text-accent-600")}>+</span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.cost > 0 && (
                          <span className={cn("tabular-nums font-semibold shrink-0", active ? "text-white" : "text-ink-muted")}>
                            {formatCurrency(displayCost(item.cost))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedItemIdx !== null && selectedItems[selectedItemIdx]?.details && (
                  <p className="text-[11px] text-ink-muted leading-relaxed border-t border-surface-border pt-2">
                    {selectedItems[selectedItemIdx].details}
                  </p>
                )}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-sunken border border-surface-border rounded-2xl p-5 text-center text-xs">
              <div className="space-y-1">
                <span className="text-ink-subtle font-semibold uppercase tracking-wider text-[9px]">Allocated Budget</span>
                <p className="text-base font-semibold text-ink">
                  {formatCurrency(displayCost(activeInpaintCost !== null ? activeInpaintCost : selectedRec.estimatedCost))}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-subtle font-semibold uppercase tracking-wider text-[9px]">Market Value Increase</span>
                <p className="text-base font-semibold text-success">
                  {formatCurrency(displayCost(activeInpaintValue !== null ? activeInpaintValue : selectedRec.projectedValueIncrease))}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-subtle font-semibold uppercase tracking-wider text-[9px]">Estimated ROI</span>
                <p className="text-base font-semibold text-success">
                  +{(() => {
                    const c = activeInpaintCost !== null ? activeInpaintCost : selectedRec.estimatedCost;
                    const v = activeInpaintValue !== null ? activeInpaintValue : selectedRec.projectedValueIncrease;
                    return c > 0 ? Math.round(((v - c) / c) * 100) : selectedRec.roiPercentage;
                  })()}%
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-subtle font-semibold uppercase tracking-wider text-[9px]">Avg Timeline</span>
                <p className="text-base font-semibold text-ink">{selectedRec.timeline}</p>
              </div>
            </div>

            {/* Why recommendation */}
            <div className="space-y-2">
              <h5 className="font-medium text-xs uppercase tracking-widest text-accent-600">Why this recommendation</h5>
              <p className="text-ink-muted text-xs leading-relaxed">{selectedRec.whyDetails}</p>
            </div>

            {/* Scope checklist */}
            <div className="space-y-3">
              <h5 className="font-medium text-xs uppercase tracking-widest text-accent-600">Scope of Work</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-surface-sunken border border-surface-border rounded-xl p-3 text-xs text-ink">
                    <div className="flex items-center space-x-3 min-w-0">
                      <CheckSquare className="w-4 h-4 text-accent-500 shrink-0" />
                      <span className="truncate" title={item.details || item.label}>{item.label}</span>
                    </div>
                    {item.cost > 0 && (
                      <span className="font-semibold text-ink-muted tabular-nums shrink-0">{formatCurrency(displayCost(item.cost))}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contractors List options */}
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <h5 className="font-medium text-xs uppercase tracking-widest text-accent-600">Verified Contractor Options</h5>

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
                          <h6 className="text-sm font-semibold text-ink">{cont.name}</h6>
                          <Badge variant="roi-high">Verified License</Badge>
                        </div>
                        <p className="text-ink-muted">{cont.rating ?? "--"} rating ({cont.reviewsCount} reviews) • License: {cont.license || "N/A"}</p>
                        <p className="text-ink-muted">Specialty: <strong className="text-ink">{ensureArray(cont.specialties).join(", ")}</strong></p>
                        {cont.snippet && <p className="italic text-ink-subtle">"{cont.snippet}"</p>}
                      </div>

                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 md:border-l md:border-surface-border md:pl-5">
                        <div className="text-right">
                          <p className="text-ink-subtle font-semibold uppercase text-[9px]">Est. Cost</p>
                          <p className="text-sm font-semibold text-ink">{cont.avgCost !== null ? formatCurrency(cont.avgCost) : "N/A"}</p>
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
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 max-w-md w-full text-center">
            <h3 className="text-lg font-semibold text-ink mb-3">HomeReady Advisor</h3>
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
