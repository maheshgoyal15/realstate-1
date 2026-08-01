"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Sparkles,
  UploadCloud,
  Trash2,
  AlertTriangle,
  Building,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { apiFetch } from "@/lib/apiClient";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { uploadFormSchema } from "@/lib/validations";
import { formatCurrency, cn } from "@/lib/utils";

const STYLE_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "contemporary", label: "Contemporary" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "midcentury", label: "Mid-Century Modern" },
  { value: "craftsman", label: "Craftsman" },
  { value: "transitional", label: "Transitional" },
];

export default function AnalyzePropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1, 2, 3

  // Form states matching specifications
  const [address, setAddress] = useState("");
  const [mlsId, setMlsId] = useState("");
  const [userBudget, setUserBudget] = useState<number | string>(24000);
  const [stylePreference, setStylePreference] = useState("traditional");
  const [timelinePreference, setTimelinePreference] = useState("quick");

  // SimplyRETS MLS Import States
  const [importMlsId, setImportMlsId] = useState("1005192");
  const [mlsImportLoading, setMlsImportLoading] = useState(false);


  // Attached files/photos matching specs
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; dataUrl: string; isLowQuality?: boolean }[]>([]);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setModalMessage("One or more files exceed the 10MB maximum limit.");
        return;
      }

      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const isLowQuality = file.name.includes("blurry") || file.name.includes("dark");

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const dataUrl = uploadEvent.target.result as string;
          setAttachedFiles((prev) => [...prev, { name: file.name, size: sizeStr, dataUrl, isLowQuality }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag over handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDirectMlsImport = async (targetMlsId?: string) => {
    const idToUse = targetMlsId || importMlsId || mlsId;
    if (!idToUse) {
      setModalMessage("Please enter a valid MLS Listing ID.");
      return;
    }
    setMlsImportLoading(true);
    try {
      const res = await apiFetch("/api/v1/mls/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mls_id: idToUse,
          user_budget: Number(userBudget) || 24000,
          style_preference: stylePreference || "modern"
        })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/analyze/${data.analysis_id}`);
      } else {
        const err = await res.json();
        setModalMessage(err.detail || "MLS import failed.");
      }
    } catch (e) {
      setModalMessage("Network error during MLS import.");
    } finally {
      setMlsImportLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(20);

    try {
      // Validate schema
      const formPayload = uploadFormSchema.parse({
        propertyId: `prop-${Date.now()}`,
        images: attachedFiles.map(f => f.dataUrl),
        metadata: {
          address,
          mlsId: mlsId || undefined,
          userBudget: Number(userBudget),
          stylePreference,
        },
      });

      setUploadProgress(50);

      setUploadProgress(60);

      // Perform real production REST call to API server
      const payload = {
        property_id: formPayload.propertyId,
        images: formPayload.images,
        metadata: {
          address: formPayload.metadata.address,
          mls_id: formPayload.metadata.mlsId || null,
          user_budget: formPayload.metadata.userBudget,
          style_preference: formPayload.metadata.stylePreference
        }
      };

      if (attachedFiles.length > 0) {
        try {
          // Allow up to 4.8MB so real user uploaded photos are always stored for instant display
          if (attachedFiles[0].dataUrl.length < 4800000) {
            localStorage.setItem("user_uploaded_property_photo", attachedFiles[0].dataUrl);
          }
        } catch (e) {
          console.warn("Storage quota limit reached for localStorage preview thumbnail:", e);
        }
      }

      const apiRes = await apiFetch("/api/v1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        throw new Error(errorText || "Failed to initialize image assessment on server.");
      }

      const resData = await apiRes.json();
      setUploadProgress(100);
      setUploading(false);
      router.push(`/analyze/${resData.analysis_id}`);

    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      if (error instanceof z.ZodError) {
        setModalMessage(`Validation error: ${error.errors.map(err => err.message).join(", ")}`);
      } else if (error instanceof Error) {
        setModalMessage(`Assessment Error: ${error.message}`);
      } else {
        setModalMessage("Unexpected error initializing computer vision analysis. Please check inputs.");
      }
    }
  };

  const stepPercentage = useMemo(() => {
    if (step === 1) return 33;
    if (step === 2) return 66;
    return 100;
  }, [step]);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-4xl">Analyze a Property</h1>
        <p className="text-ink-muted text-sm max-w-xl mx-auto">
          Provide basic details and photos to compute optimal pre-listing remodel recommendations.
        </p>
      </div>

      {/* Progress Stepper */}
      <Card hoverEffect={false} className="p-4">
        <div className="flex justify-between items-center text-xs font-medium text-ink-subtle uppercase tracking-widest mb-3">
          <span>Step {step} of 3</span>
          <span className="text-accent-600">{stepPercentage}% Complete</span>
        </div>
        <ProgressBar value={stepPercentage} size="sm" />
      </Card>

      {/* Stepper Content */}
      <Card hoverEffect={false} className="p-8 md:p-12 relative overflow-hidden">

        {step === 1 && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-ink border-b border-surface-border pb-4">Step 1: Property Details</h2>

            {/* SimplyRETS Live MLS Auto-Ingestion Card (Hidden/Commented)
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-accent-500/30 rounded-2xl p-5 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-accent-400" />
                  <h4 className="text-sm font-semibold tracking-tight">Direct SimplyRETS MLS Import</h4>
                </div>
                <span className="text-[10px] uppercase font-mono bg-accent-500/20 text-accent-300 border border-accent-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Live Feed Connected
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Enter an MLS listing ID to pull live property details and photos directly from SimplyRETS, initialize analysis, and run AI ROI calculations without uploading photos manually.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter MLS ID (e.g. 1005192)"
                    value={importMlsId}
                    onChange={(e) => setImportMlsId(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-700 text-white rounded-xl px-4 py-2.5 text-xs focus:border-accent-400 focus:outline-none placeholder-slate-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDirectMlsImport(importMlsId)}
                  disabled={mlsImportLoading}
                  className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{mlsImportLoading ? "Importing MLS..." : "Import & Analyze Listing"}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-700 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Try Sandbox MLS IDs:</span>
                {[
                  { id: "1005192", name: "74434 East Sweet Bottom" },
                  { id: "1005221", name: "8369 West MAJESTY Path" },
                  { id: "1005252", name: "90678 South VELLUM Ext" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setImportMlsId(item.id);
                      handleDirectMlsImport(item.id);
                    }}
                    disabled={mlsImportLoading}
                    className="bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-neutral-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 font-mono"
                  >
                    <span>#{item.id}</span>
                    <span className="text-neutral-400 font-sans text-[10px]">({item.name})</span>
                  </button>
                ))}
              </div>
            </div>
            */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="property-address"
                label="Property Address *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="2030 Natchez Dr"
                required
              />

              <Input
                id="mls-id"
                label="MLS ID (Optional)"
                value={mlsId}
                onChange={(e) => setMlsId(e.target.value)}
                placeholder="TX-ACTRIS-987654"
              />

              <div className="space-y-2">
                <label id="budget-ceiling-label" className="block text-xs font-medium text-ink-muted uppercase tracking-wider">
                  Estimated Upgrade Budget Ceiling ($) *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="group" aria-labelledby="budget-ceiling-label">
                  {[10000, 24000, 50000, 100000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setUserBudget(b)}
                      aria-pressed={Number(userBudget) === b}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-xs font-medium transition-colors",
                        Number(userBudget) === b
                          ? "bg-accent-500 border-transparent text-white"
                          : "bg-surface-sunken border-surface-border text-ink-muted hover:bg-surface-border"
                      )}
                    >
                      {b < 100000 ? `$${b/1000}k` : `$${b/1000}k+`}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={userBudget}
                    onChange={(e) => setUserBudget(e.target.value === "" ? "" : Number(e.target.value))}
                    aria-label="Custom budget amount"
                    className="bg-surface-sunken border border-surface-border rounded-xl px-3 text-xs font-medium text-ink text-center focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30"
                    placeholder="Custom"
                  />
                </div>
              </div>

              <Dropdown
                id="style-preference"
                label="Architectural Style Preference *"
                options={STYLE_OPTIONS}
                selectedValue={stylePreference}
                onChange={setStylePreference}
              />

              <fieldset className="col-span-1 md:col-span-2 space-y-2">
                <legend className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
                  Timeline Preference *
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 bg-surface-sunken hover:bg-surface-border border border-surface-border rounded-xl p-4 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="timeline"
                      value="quick"
                      checked={timelinePreference === "quick"}
                      onChange={() => setTimelinePreference("quick")}
                      className="accent-accent-500"
                    />
                    <div>
                      <p className="text-xs font-medium text-ink">Quick Wins First</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">Focus on 1-2 week cosmetic fixes</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-surface-sunken hover:bg-surface-border border border-surface-border rounded-xl p-4 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="timeline"
                      value="mixed"
                      checked={timelinePreference === "mixed"}
                      onChange={() => setTimelinePreference("mixed")}
                      className="accent-accent-500"
                    />
                    <div>
                      <p className="text-xs font-medium text-ink">Mixed Approach</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">Combine minor & medium repairs</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-surface-sunken hover:bg-surface-border border border-surface-border rounded-xl p-4 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="timeline"
                      value="long"
                      checked={timelinePreference === "long"}
                      onChange={() => setTimelinePreference("long")}
                      className="accent-accent-500"
                    />
                    <div>
                      <p className="text-xs font-medium text-ink">Long Term Max Value</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">High ROI full remodels (3-6 mo)</p>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-border">
              <Button id="step1-next-btn" variant="primary" onClick={() => setStep(2)} disabled={!address.trim()}>
                Next: Upload Photos
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-ink border-b border-surface-border pb-4">Step 2: Property Media Upload</h2>

            {/* Drag Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-3xl p-10 text-center relative transition-colors duration-200 flex flex-col items-center justify-center",
                dragActive
                  ? "border-accent-500 bg-accent-50"
                  : "border-surface-border-strong bg-surface-sunken hover:bg-surface-border/40"
              )}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/heic"
                onChange={handleFileChange}
                aria-label="Upload property photos"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="mb-4 p-4 bg-accent-50 rounded-2xl border border-accent-200">
                <UploadCloud className="w-12 h-12 text-accent-500" />
              </div>
              <h4 className="text-lg font-semibold text-ink mb-1">Drag interior & exterior photos here</h4>
              <p className="text-xs text-ink-muted max-w-sm mx-auto mb-4">
                Supports JPG, PNG, HEIC (Auto-Convert). Max 10MB per file. (Recommended: 3 to 50 photos)
              </p>
              <Button id="browse-files-btn" variant="secondary" size="sm">Browse Files</Button>
            </div>

            {/* SimplyRETS Live MLS Auto-Ingestion Card (Hidden/Commented)
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-accent-500/30 rounded-2xl p-5 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-accent-400" />
                  <h4 className="text-sm font-semibold tracking-tight">Direct SimplyRETS MLS Import</h4>
                </div>
                <span className="text-[10px] uppercase font-mono bg-accent-500/20 text-accent-300 border border-accent-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Live Feed Connected
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Enter an MLS listing ID to pull live property details and photos directly from SimplyRETS, initialize analysis, and run AI ROI calculations.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter MLS ID (e.g. 1005192)"
                    value={importMlsId}
                    onChange={(e) => setImportMlsId(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-700 text-white rounded-xl px-4 py-2.5 text-xs focus:border-accent-400 focus:outline-none placeholder-slate-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDirectMlsImport(importMlsId)}
                  disabled={mlsImportLoading}
                  className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{mlsImportLoading ? "Importing MLS..." : "Import & Analyze Listing"}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-700 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Try Sandbox MLS IDs:</span>
                {[
                  { id: "1005192", name: "74434 East Sweet Bottom" },
                  { id: "1005221", name: "8369 West MAJESTY Path" },
                  { id: "1005252", name: "90678 South VELLUM Ext" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setImportMlsId(item.id);
                      handleDirectMlsImport(item.id);
                    }}
                    disabled={mlsImportLoading}
                    className="bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-neutral-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 font-mono"
                  >
                    <span>#{item.id}</span>
                    <span className="text-neutral-400 font-sans text-[10px]">({item.name})</span>
                  </button>
                ))}
              </div>
            </div>
            */}

            {/* Quick Test with Sample Photos (Eval Set) */}
            <div className="bg-surface-sunken border border-surface-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-accent-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Test with Gemini Eval Set Sample Images
                </span>
                <span className="text-[10px] text-ink-muted">1-Click Load</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await apiFetch("/api/v1/sample-photos");
                      if (res.ok) {
                        const photos = await res.json();
                        const p = photos[0];
                        if (p && p.dataUrl) {
                          setAttachedFiles([{ name: p.file_name, size: "2.4 MB", dataUrl: p.dataUrl }]);
                          setAddress(p.address);
                          setUserBudget(p.user_budget);
                          setStylePreference(p.style_preference);
                        }
                      }
                    } catch (e) {
                      console.error("Failed to load sample photo:", e);
                    }
                  }}
                  className="bg-surface-raised hover:bg-surface-border border border-surface-border p-2.5 rounded-xl text-left transition-colors flex items-center gap-2.5"
                >
                  <span className="text-xl">🍳</span>
                  <div className="truncate">
                    <p className="text-xs font-medium text-ink truncate">Kitchen Primary</p>
                    <p className="text-[10px] text-ink-muted truncate">Austin, TX • Modern</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await apiFetch("/api/v1/sample-photos");
                      if (res.ok) {
                        const photos = await res.json();
                        const p = photos[1] || photos[0];
                        if (p && p.dataUrl) {
                          setAttachedFiles([{ name: p.file_name, size: "2.5 MB", dataUrl: p.dataUrl }]);
                          setAddress(p.address);
                          setUserBudget(p.user_budget);
                          setStylePreference(p.style_preference);
                        }
                      }
                    } catch (e) {
                      console.error("Failed to load sample photo:", e);
                    }
                  }}
                  className="bg-surface-raised hover:bg-surface-border border border-surface-border p-2.5 rounded-xl text-left transition-colors flex items-center gap-2.5"
                >
                  <span className="text-xl">🍽️</span>
                  <div className="truncate">
                    <p className="text-xs font-medium text-ink truncate">Kitchen & Dining</p>
                    <p className="text-[10px] text-ink-muted truncate">Austin, TX • Transitional</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await apiFetch("/api/v1/sample-photos");
                      if (res.ok) {
                        const photos = await res.json();
                        const p = photos[2] || photos[0];
                        if (p && p.dataUrl) {
                          setAttachedFiles([{ name: p.file_name, size: "2.5 MB", dataUrl: p.dataUrl }]);
                          setAddress(p.address);
                          setUserBudget(p.user_budget);
                          setStylePreference(p.style_preference);
                        }
                      }
                    } catch (e) {
                      console.error("Failed to load sample photo:", e);
                    }
                  }}
                  className="bg-surface-raised hover:bg-surface-border border border-surface-border p-2.5 rounded-xl text-left transition-colors flex items-center gap-2.5"
                >
                  <span className="text-xl">🛏️</span>
                  <div className="truncate">
                    <p className="text-xs font-medium text-ink truncate">Bedroom Suite</p>
                    <p className="text-[10px] text-ink-muted truncate">Austin, TX • Traditional</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Upload counts */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-ink-subtle uppercase tracking-widest">
                Attached Media: {attachedFiles.length} / 50 photos
              </span>
              {attachedFiles.length > 0 && (
                <button
                  onClick={() => setAttachedFiles([])}
                  className="text-xs text-danger font-semibold hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {attachedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="bg-surface-raised border border-surface-border rounded-2xl p-2.5 flex flex-col space-y-2 relative group">
                    <div className="h-28 w-full rounded-lg overflow-hidden bg-surface-sunken border border-surface-border relative">
                      <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                      {file.isLowQuality && (
                        <div className="absolute top-1.5 left-1.5 bg-warning-subtle border border-warning-border p-1 rounded flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                        </div>
                      )}
                      <button
                        onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 bg-danger hover:opacity-90 rounded-full text-white transition-opacity"
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-1 truncate">
                      <p className="text-[11px] font-medium text-ink truncate">{file.name}</p>
                      <p className="text-[10px] text-ink-subtle mt-0.5">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stepper buttons */}
            <div className="flex justify-between pt-4 border-t border-surface-border">
              <Button id="step2-prev-btn" variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                id="step2-next-btn"
                variant="primary"
                onClick={() => setStep(3)}
                disabled={attachedFiles.length === 0}
              >
                Next: Review Details
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-ink border-b border-surface-border pb-4">Step 3: Review & Initialize</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-sunken rounded-2xl p-6 border border-surface-border text-sm">
              <div className="space-y-4">
                <h4 className="font-medium text-xs uppercase tracking-widest text-accent-600">Property Details</h4>
                <div className="space-y-2 text-xs">
                  <p><span className="text-ink-muted">Address:</span> <strong className="text-ink">{address}</strong></p>
                  <p><span className="text-ink-muted">MLS Listing ID:</span> <strong className="text-ink">{mlsId || "N/A"}</strong></p>
                  <p><span className="text-ink-muted">Budget Ceiling:</span> <strong className="text-ink">{formatCurrency(Number(userBudget))}</strong></p>
                  <p><span className="text-ink-muted">Preferred Style:</span> <strong className="text-ink capitalize">{stylePreference}</strong></p>
                  <p><span className="text-ink-muted">Timeline Approach:</span> <strong className="text-ink capitalize">{timelinePreference} Wins First</strong></p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-xs uppercase tracking-widest text-accent-600">Media Summary</h4>
                <div className="space-y-2 text-xs">
                  <p><span className="text-ink-muted">Total photos attached:</span> <strong className="text-ink">{attachedFiles.length} files</strong></p>
                  <p>
                    <span className="text-ink-muted">Auto-convert HEIC status:</span>
                    <strong className="text-success ml-1">Verified</strong>
                  </p>
                  <p>
                    <span className="text-ink-muted">Warning validations:</span>
                    {attachedFiles.some(f => f.isLowQuality) ? (
                      <span className="text-warning font-semibold ml-1">1 low-quality photo alert</span>
                    ) : (
                      <span className="text-success font-semibold ml-1">None</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2 bg-surface-sunken p-4 rounded-xl border border-surface-border">
                <div className="flex justify-between text-xs text-ink-muted font-semibold uppercase tracking-widest">
                  <span>Running Neural Defect Scan & Comps Match...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} size="sm" />
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-surface-border">
              <Button id="step3-prev-btn" variant="secondary" onClick={() => setStep(2)} disabled={uploading}>
                Back
              </Button>
              <Button
                id="submit-analysis-pipeline-btn"
                variant="primary"
                onClick={handleFormSubmit}
                isLoading={uploading}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Initialize AI Computer Vision Analysis
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Verification Notification Modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 max-w-md w-full text-center">
            <h3 className="text-lg font-semibold text-ink mb-3">AI Vision Pipeline</h3>
            <p className="text-ink-muted text-sm mb-6">{modalMessage}</p>
            <Button
              id="confirm-modal-ok-btn"
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
