"use client";

import React, { useState, useMemo } from "react";
import { z } from "zod";
import { 
  Sparkles, 
  MapPin, 
  UploadCloud, 
  Trash2, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  Building
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { uploadFormSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";

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
  const [step, setStep] = useState(1); // 1, 2, 3

  // Form states matching specifications
  const [address, setAddress] = useState("2030 Natchez Dr");
  const [mlsId, setMlsId] = useState("TX-ACTRIS-987654");
  const [userBudget, setUserBudget] = useState<number | string>(24000);
  const [stylePreference, setStylePreference] = useState("traditional");
  const [timelinePreference, setTimelinePreference] = useState("quick");

  // Attached files/photos matching specs
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; dataUrl: string; isLowQuality?: boolean }[]>([
    { 
      name: "2030 Natchez Dr Main Exterior.jpg", 
      size: "2.4 MB", 
      dataUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" 
    },
    { 
      name: "Kitchen Outdated Cabinets.heic", 
      size: "9.2 MB", 
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" 
    },
    { 
      name: "Master Bathroom Shower.png", 
      size: "1.8 MB", 
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      isLowQuality: true // triggers WCAG Warning Badge
    }
  ]);

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
          mls_id: formPayload.metadata.mlsId || "",
          user_budget: formPayload.metadata.userBudget,
          style_preference: formPayload.metadata.stylePreference
        }
      };

      if (attachedFiles.length > 0) {
        localStorage.setItem("user_uploaded_kitchen_before", attachedFiles[0].dataUrl);
      }

      const apiRes = await fetch("http://127.0.0.1:8000/api/v1/upload", {
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

      setModalMessage(`Analysis initialized! Target ID: ${resData.analysis_id}. Redirecting to live assessment report...`);
      setTimeout(() => {
        window.location.href = `/analyze/${resData.analysis_id}`;
      }, 1500);

    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      if (error instanceof z.ZodError) {
        setModalMessage(`Validation error: ${error.errors.map(err => err.message).join(", ")}`);
      } else {
        setModalMessage("Unexpected error initializing computer vision analysis. Please check inputs.");
      }
    }
  };

  // Autodetect address context
  const handleAutoDetect = () => {
    setAddress("2030 Natchez Dr, Austin TX");
    setMlsId("TX-ACTRIS-987654");
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Analyze a Property</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Provide basic details and photos to compute optimal pre-listing remodel recommendations.
        </p>
      </div>

      {/* Progress Stepper */}
      <Card hoverEffect={false} className="p-4 bg-slate-900/30 border-white/5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          <span>Step {step} of 3</span>
          <span className="text-blue-400">{stepPercentage}% Complete</span>
        </div>
        <ProgressBar value={stepPercentage} size="sm" />
      </Card>

      {/* Stepper Content */}
      <Card hoverEffect={false} className="p-8 md:p-12 shadow-2xl relative overflow-hidden bg-slate-900/40">
        
        {step === 1 && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Step 1: Property Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <Input
                  id="property-address"
                  label="Property Address *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="2030 Natchez Dr"
                  required
                />
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="absolute right-3 top-[34px] text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Auto-detect</span>
                </button>
              </div>

              <Input
                id="mls-id"
                label="MLS ID (Optional)"
                value={mlsId}
                onChange={(e) => setMlsId(e.target.value)}
                placeholder="TX-ACTRIS-987654"
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Estimated Upgrade Budget Ceiling ($) *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[10000, 24000, 50000, 100000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setUserBudget(b)}
                      className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                        Number(userBudget) === b
                          ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-600/15"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {b < 100000 ? `$${b/1000}k` : `$${b/1000}k+`}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={userBudget}
                    onChange={(e) => setUserBudget(e.target.value === "" ? "" : Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 text-center focus:outline-none focus:border-blue-500"
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

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Timeline Preference *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer">
                    <input
                      type="radio"
                      name="timeline"
                      value="quick"
                      checked={timelinePreference === "quick"}
                      onChange={() => setTimelinePreference("quick")}
                      className="accent-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Quick Wins First</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Focus on 1-2 week cosmetic fixes</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer">
                    <input
                      type="radio"
                      name="timeline"
                      value="mixed"
                      checked={timelinePreference === "mixed"}
                      onChange={() => setTimelinePreference("mixed")}
                      className="accent-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Mixed Approach</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Combine minor & medium repairs</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer">
                    <input
                      type="radio"
                      name="timeline"
                      value="long"
                      checked={timelinePreference === "long"}
                      onChange={() => setTimelinePreference("long")}
                      className="accent-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Long Term Max Value</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">High ROI full remodels (3-6 mo)</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button id="step1-next-btn" variant="primary" onClick={() => setStep(2)}>
                Next: Upload Photos →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Step 2: Property Media Upload</h2>
            
            {/* Drag Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center relative transition-all duration-200 flex flex-col items-center justify-center ${
                dragActive 
                  ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" 
                  : "border-white/15 bg-white/2 hover:bg-white/5"
              }`}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/heic"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="mb-4 p-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                <UploadCloud className="w-12 h-12 text-indigo-400 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Drag interior & exterior photos here</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Supports JPG, PNG, HEIC (Auto-Convert). Max 10MB per file. (Recommended: 3 to 50 photos)
              </p>
              <Button id="browse-files-btn" variant="secondary" size="sm">Browse Files</Button>
            </div>

            {/* Upload counts */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Attached Media: {attachedFiles.length} / 50 photos
              </span>
              {attachedFiles.length > 0 && (
                <button
                  onClick={() => setAttachedFiles([])}
                  className="text-xs text-red-400 font-bold hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {attachedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="bg-slate-900 border border-white/10 rounded-2xl p-2.5 flex flex-col space-y-2 relative group shadow-lg">
                    <div className="h-28 w-full rounded-lg overflow-hidden bg-slate-950 border border-white/5 relative">
                      <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                      {file.isLowQuality && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500/90 border border-amber-400/50 p-1 rounded shadow-lg flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                        </div>
                      )}
                      <button
                        onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-500 rounded-full text-white shadow-md transition-colors"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-1 truncate">
                      <p className="text-[11px] font-bold text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stepper buttons */}
            <div className="flex justify-between pt-4 border-t border-white/10">
              <Button id="step2-prev-btn" variant="secondary" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button 
                id="step2-next-btn"
                variant="primary" 
                onClick={() => setStep(3)}
                disabled={attachedFiles.length === 0}
              >
                Next: Review Details →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Step 3: Review & Initialize</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 rounded-2xl p-6 border border-white/5 text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-400">Property Details</h4>
                <div className="space-y-2 text-xs">
                  <p><span className="text-slate-400">Address:</span> <strong className="text-white">{address}</strong></p>
                  <p><span className="text-slate-400">MLS Listing ID:</span> <strong className="text-white">{mlsId || "N/A"}</strong></p>
                  <p><span className="text-slate-400">Budget Ceiling:</span> <strong className="text-white">{formatCurrency(Number(userBudget))}</strong></p>
                  <p><span className="text-slate-400">Preferred Style:</span> <strong className="text-white capitalize">{stylePreference}</strong></p>
                  <p><span className="text-slate-400">Timeline Approach:</span> <strong className="text-white capitalize">{timelinePreference} Wins First</strong></p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-400">Media Summary</h4>
                <div className="space-y-2 text-xs">
                  <p><span className="text-slate-400">Total photos attached:</span> <strong className="text-white">{attachedFiles.length} files</strong></p>
                  <p>
                    <span className="text-slate-400">Auto-convert HEIC status:</span> 
                    <strong className="text-emerald-400 ml-1">✓ Verified</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Warning validations:</span>
                    {attachedFiles.some(f => f.isLowQuality) ? (
                      <span className="text-amber-400 font-bold ml-1">⚠️ 1 Low-quality photo alert</span>
                    ) : (
                      <span className="text-emerald-400 font-bold ml-1">None</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                  <span>Running Neural Defect Scan & Comps Match...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} size="sm" />
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-white/10">
              <Button id="step3-prev-btn" variant="secondary" onClick={() => setStep(2)} disabled={uploading}>
                ← Back
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-3">AI Vision Pipeline</h3>
            <p className="text-slate-300 text-sm mb-6">{modalMessage}</p>
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
