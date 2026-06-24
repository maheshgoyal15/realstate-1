"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Star, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Bookmark, 
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

// Mock Contractors
const INITIAL_CONTRACTORS = [
  {
    id: "cont-1",
    name: "Home Remodeling Pro",
    rating: 4.8,
    reviewsCount: 142,
    license: "TCLD-12345",
    location: "Austin, TX",
    distance: 5,
    specialties: ["Kitchens", "Bathrooms", "Hardwoods"],
    avgCost: 34500,
    avgTimeline: "4-5 Weeks",
    availability: "Starting Jan 15, 2025",
    snippet: "Excellent communication, finished on time!",
    bio: "Home Remodeling Pro has served the Austin metro area since 2012. We specialize in high-end structural modifications, custom cabinetry, and premium tiling.",
    pricingInfo: [
      { project: "Kitchen Remodel", cost: "$30k - $45k" },
      { project: "Bath Modernization", cost: "$15k - $25k" },
      { project: "Hardwood Refinishing", cost: "$4k - $8k" }
    ],
    reviews: [
      { author: "Sarah M.", rating: 5, text: "They completely refaced our dated 90s kitchen. The quartz installation is stunning!" },
      { author: "Devin K.", rating: 4, text: "Solid work on the hardwood sanding. Highly recommend." }
    ]
  },
  {
    id: "cont-2",
    name: "Austin Kitchen & Bath Co.",
    rating: 4.6,
    reviewsCount: 89,
    license: "TCLD-56789",
    location: "Austin, TX",
    distance: 2,
    specialties: ["Kitchens", "Bathrooms", "Countertops"],
    avgCost: 35800,
    avgTimeline: "6-7 Weeks",
    availability: "Immediate Start",
    snippet: "Very professional crew and great cleanup.",
    bio: "Austin Kitchen & Bath Co. focuses on modern functional kitchen layouts and bathroom spa integrations.",
    pricingInfo: [
      { project: "Kitchen Remodel", cost: "$32k - $48k" },
      { project: "Bath Modernization", cost: "$12k - $22k" }
    ],
    reviews: [
      { author: "Linda P.", rating: 5, text: "Excellent design choices, helped us get high value upgrades within our budget." }
    ]
  },
  {
    id: "cont-3",
    name: "Elite Roofing Austin",
    rating: 4.9,
    reviewsCount: 210,
    license: "ROOF-9912",
    location: "Austin, TX",
    distance: 8,
    specialties: ["Roofing", "Gutters", "Siding"],
    avgCost: 8200,
    avgTimeline: "1-2 Weeks",
    availability: "Next Week",
    snippet: "Fast service, handled the insurance details perfectly.",
    bio: "Elite Roofing offers rapid-response roof replacements, composite shingle repairs, and gutter guard installations.",
    pricingInfo: [
      { project: "Roof Replacement", cost: "$8k - $14k" },
      { project: "Flashing & Patching", cost: "$1k - $3k" }
    ],
    reviews: [
      { author: "James D.", rating: 5, text: "Fixed leak in less than 24 hours. Phenomenal response times." }
    ]
  }
];

export default function ContractorsPage() {
  const [contractors, setContractors] = useState(INITIAL_CONTRACTORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Modals state
  const [selectedContractor, setSelectedContractor] = useState<typeof INITIAL_CONTRACTORS[0] | null>(null);
  const [quoteContractor, setQuoteContractor] = useState<typeof INITIAL_CONTRACTORS[0] | null>(null);
  const [savedContractors, setSavedContractors] = useState<Record<string, boolean>>({});
  
  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");

  const handleSaveToggle = (id: string) => {
    setSavedContractors(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      setToastMessage(updated[id] ? "Contractor added to favorites." : "Contractor removed from favorites.");
      return updated;
    });
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteContractor) {
      setToastMessage(`Quote request submitted successfully to ${quoteContractor.name}! They will contact you shortly.`);
      setQuoteContractor(null);
      setUserNotes("");
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
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Contractor Network</h1>
        <p className="text-slate-400 text-sm">
          Hire licensed and verified local contractors pre-matched to carry out your AI upgrade recommendations.
        </p>
      </div>

      {/* Filter Toolbar */}
      <section className="glass-card p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-white/5 bg-slate-900/30">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, category, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
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
        {filteredContractors.length === 0 ? (
          <Card hoverEffect={false} className="p-12 text-center border-white/5 bg-slate-900/20">
            <p className="text-slate-400 text-sm font-semibold">No matching contractors found in your area.</p>
          </Card>
        ) : (
          filteredContractors.map((cont) => (
            <Card 
              key={cont.id}
              className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border border-white/10 bg-slate-900/40 relative overflow-hidden"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <h3 
                    onClick={() => setSelectedContractor(cont)}
                    className="text-lg font-bold text-white tracking-tight hover:text-blue-400 hover:underline cursor-pointer"
                  >
                    {cont.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{cont.rating}</span>
                    <span className="text-slate-500 font-semibold">({cont.reviewsCount} reviews)</span>
                  </div>
                  <Badge variant="roi-high" className="text-[9px]">Verified License</Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span>{cont.location} ({cont.distance} miles away)</span>
                  </span>
                  <span>•</span>
                  <span>License: <strong>{cont.license}</strong></span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Availability: <strong className="text-white">{cont.availability}</strong></span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {cont.specialties.map((spec, sIdx) => (
                    <span key={sIdx} className="bg-white/5 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] font-bold text-indigo-300">
                      {spec}
                    </span>
                  ))}
                </div>

                <p className="italic text-xs text-slate-500 pt-2">
                  "{cont.snippet}"
                </p>
              </div>

              {/* Action columns */}
              <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0 md:border-l md:border-white/10 md:pl-8">
                <div className="text-right">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Est. upgrade cost</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(cont.avgCost)}</p>
                  <p className="text-[10px] text-slate-400">Average duration: {cont.avgTimeline}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveToggle(cont.id)}
                    className={`p-2 rounded-full border transition-all ${
                      savedContractors[cont.id] 
                        ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                    aria-label="Add to favorites"
                  >
                    <Bookmark className="w-4.5 h-4.5" />
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
              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Biography</h4>
              <p className="text-slate-300 text-xs leading-relaxed">{selectedContractor.bio}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Standard Pricing Tiers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedContractor.pricingInfo.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950 border border-white/5 rounded-xl p-4 text-xs font-semibold">
                    <span className="text-slate-350">{p.project}</span>
                    <span className="text-emerald-400">{p.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Recent Customer Reviews</h4>
              <div className="space-y-3">
                {selectedContractor.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{rev.author}</span>
                      <span className="text-amber-400">{"★".repeat(rev.rating)}</span>
                    </div>
                    <p className="text-slate-400 leading-normal">"{rev.text}"</p>
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
              <Button id="quote-submit-btn" variant="primary" onClick={handleQuoteSubmit}>Submit Quote Request</Button>
            </div>
          }
        >
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
              Submit your active property context media, structural flags, and MLS details to <strong>{quoteContractor.name}</strong>.
            </p>
            <div className="space-y-1">
              <label htmlFor="quote-notes" className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
                Notes for Contractor (Special requests, timing restrictions)
              </label>
              <textarea
                id="quote-notes"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g. Please consider wide-plank wood floor options only..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* System Toast notification element */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="text-xs font-bold">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-mono">×</button>
        </div>
      )}
    </div>
  );
}
