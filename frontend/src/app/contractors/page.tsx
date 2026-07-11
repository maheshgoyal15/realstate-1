"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Star,
  MapPin,
  Bookmark,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, cn } from "@/lib/utils";
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
  bio: string | null;
  pricingInfo: { project: string; cost: string }[];
  reviews: { author: string; rating: number; text: string }[];
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals state
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [quoteContractor, setQuoteContractor] = useState<Contractor | null>(null);
  const [savedContractors, setSavedContractors] = useState<Record<string, boolean>>({});

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/contractors");
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(true);
          return;
        }
        const data = await res.json();
        setContractors(data);
      } catch (error) {
        console.error("Failed to load contractors:", error);
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveToggle = (id: string) => {
    setSavedContractors(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      setToastMessage(updated[id] ? "Contractor added to favorites." : "Contractor removed from favorites.");
      return updated;
    });
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteContractor) return;

    setSubmittingQuote(true);
    try {
      const res = await apiFetch("/api/v1/contractors/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: quoteContractor.id,
          user_notes: userNotes || undefined,
        }),
      });

      if (res.ok) {
        setToastMessage(`Quote request submitted successfully to ${quoteContractor.name}! They will contact you shortly.`);
        setQuoteContractor(null);
        setUserNotes("");
      } else {
        setToastMessage("Failed to submit quote request. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit quote request:", error);
      setToastMessage("Failed to submit quote request. Please try again.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Filter
  const filteredContractors = useMemo(() => {
    return contractors.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || c.specialties.includes(categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [contractors, searchQuery, categoryFilter]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-serif text-ink tracking-tight">Contractor Network</h1>
        <p className="text-ink-muted text-sm">
          Hire licensed and verified local contractors pre-matched to carry out your AI upgrade recommendations.
        </p>
      </div>

      {/* Filter Toolbar */}
      <section className="card-surface p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            placeholder="Search by name, category, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-sunken border border-surface-border-strong rounded-xl pl-9 pr-4 py-2 text-xs text-ink focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by specialty"
            className="bg-surface-sunken border border-surface-border-strong rounded-xl px-4 py-2 text-xs text-ink-muted focus:outline-none focus:border-accent-500 cursor-pointer"
          >
            <option value="all">All Specialties</option>
            <option value="Kitchens">Kitchen Specialists</option>
            <option value="Bathrooms">Bathroom Remodelers</option>
            <option value="Roofing">Roofing Contractors</option>
          </select>
        </div>
      </section>

      {/* List cards */}
      <section className="space-y-6">
        {loadError ? (
          <Card hoverEffect={false} className="p-12 text-center">
            <p className="text-ink-muted text-sm font-semibold">Couldn't load the contractor network right now. Please refresh to try again.</p>
          </Card>
        ) : filteredContractors.length === 0 ? (
          <Card hoverEffect={false} className="p-12 text-center">
            <p className="text-ink-muted text-sm font-semibold">No matching contractors found in your area.</p>
          </Card>
        ) : (
          filteredContractors.map((cont) => (
            <Card
              key={cont.id}
              className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                  <button
                    onClick={() => setSelectedContractor(cont)}
                    className="text-lg font-bold text-ink tracking-tight hover:text-accent-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-sm"
                  >
                    {cont.name}
                  </button>
                  <div className="flex items-center space-x-1 text-warning text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{cont.rating ?? "--"}</span>
                    <span className="text-ink-subtle font-semibold">({cont.reviewsCount} reviews)</span>
                  </div>
                  <Badge variant="roi-high" className="text-[9px]">Verified License</Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-accent-500" />
                    <span>{cont.location || "Location unavailable"}</span>
                  </span>
                  <span>•</span>
                  <span>License: <strong className="text-ink">{cont.license || "N/A"}</strong></span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-success" />
                    <span>Availability: <strong className="text-ink">{cont.availability || "N/A"}</strong></span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {cont.specialties.map((spec, sIdx) => (
                    <span key={sIdx} className="bg-accent-50 border border-accent-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-accent-700">
                      {spec}
                    </span>
                  ))}
                </div>

                {cont.snippet && (
                  <p className="italic text-xs text-ink-subtle pt-2">
                    "{cont.snippet}"
                  </p>
                )}
              </div>

              {/* Action columns */}
              <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 md:border-l md:border-surface-border md:pl-8">
                <div className="text-right">
                  <p className="text-ink-subtle font-bold uppercase tracking-wider text-[9px]">Est. upgrade cost</p>
                  <p className="text-base font-extrabold text-ink mt-0.5">{cont.avgCost !== null ? formatCurrency(cont.avgCost) : "N/A"}</p>
                  <p className="text-[10px] text-ink-muted">Average duration: {cont.avgTimeline || "N/A"}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveToggle(cont.id)}
                    className={cn(
                      "p-2 rounded-full border transition-colors",
                      savedContractors[cont.id]
                        ? "bg-accent-50 border-accent-200 text-accent-600"
                        : "bg-surface-sunken border-surface-border text-ink-subtle hover:text-ink"
                    )}
                    aria-label={savedContractors[cont.id] ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Bookmark className={cn("w-4.5 h-4.5", savedContractors[cont.id] && "fill-current")} />
                  </button>
                  <Button
                    id={`cont-profile-${cont.id}`}
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedContractor(cont)}
                  >
                    Profile
                  </Button>
                  <Button
                    id={`cont-quote-${cont.id}`}
                    variant="primary"
                    size="sm"
                    onClick={() => setQuoteContractor(cont)}
                  >
                    Request Quote
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>

      {/* Profile Deep-Dive Modal */}
      {selectedContractor && (
        <Modal
          isOpen={!!selectedContractor}
          onClose={() => setSelectedContractor(null)}
          title={`Contractor Profile: ${selectedContractor.name}`}
          size="lg"
          footer={
            <Button id="profile-close-btn" variant="primary" onClick={() => setSelectedContractor(null)}>Close Profile</Button>
          }
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-widest text-accent-600">Biography</h4>
              <p className="text-ink-muted text-xs leading-relaxed">{selectedContractor.bio || "No biography provided."}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-surface-border">
              <h4 className="text-sm font-bold uppercase tracking-widest text-accent-600">Standard Pricing Tiers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedContractor.pricingInfo.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-surface-sunken border border-surface-border rounded-xl p-4 text-xs font-semibold">
                    <span className="text-ink-muted">{p.project}</span>
                    <span className="text-success">{p.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-surface-border">
              <h4 className="text-sm font-bold uppercase tracking-widest text-accent-600">Recent Customer Reviews</h4>
              <div className="space-y-3">
                {selectedContractor.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-surface-sunken border border-surface-border rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-ink">
                      <span>{rev.author}</span>
                      <span className="text-warning">{"★".repeat(rev.rating)}</span>
                    </div>
                    <p className="text-ink-muted leading-normal">"{rev.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quote Request Modal */}
      {quoteContractor && (
        <Modal
          isOpen={!!quoteContractor}
          onClose={() => setQuoteContractor(null)}
          title={`Request Quote from ${quoteContractor.name}`}
          footer={
            <div className="flex justify-end space-x-3">
              <Button id="quote-cancel-btn" variant="secondary" onClick={() => setQuoteContractor(null)}>Cancel</Button>
              <Button id="quote-submit-btn" variant="primary" onClick={handleQuoteSubmit} disabled={submittingQuote} isLoading={submittingQuote}>
                Submit Quote Request
              </Button>
            </div>
          }
        >
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <p className="text-xs text-ink-muted">
              Submit your active property context media, structural flags, and MLS details to <strong className="text-ink">{quoteContractor.name}</strong>.
            </p>
            <div className="space-y-1">
              <label htmlFor="quote-notes" className="block text-xs font-bold text-ink-muted uppercase tracking-widest">
                Notes for Contractor (Special requests, timing restrictions)
              </label>
              <textarea
                id="quote-notes"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g. Please consider wide-plank wood floor options only..."
                className="w-full h-24 bg-surface-sunken border border-surface-border-strong rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* System Toast notification element */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-surface-raised border border-success-border text-success rounded-xl p-4 shadow-card-hover animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-bold">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} aria-label="Dismiss notification" className="text-ink-subtle hover:text-ink font-mono">×</button>
        </div>
      )}
    </div>
  );
}
