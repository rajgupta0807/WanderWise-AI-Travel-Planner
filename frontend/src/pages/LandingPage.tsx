import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Clock,
  Navigation,
  CheckCircle2,
  Sliders,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [activePreviewDay, setActivePreviewDay] = useState(1);

  const handleGuestDemo = async () => {
    await loginAsGuest();
    navigate('/dashboard');
  };

  const previewDays = [
    {
      day: 1,
      theme: 'Arrival in the City of Light & Historic Heart',
      morning: 'Explore Île de la Cité & Notre-Dame Forecourt',
      afternoon: 'Louvre Courtyard & Tuileries Garden Walk',
      evening: 'Sunset Cruise on the River Seine',
      cost: '€40.00 / person',
    },
    {
      day: 2,
      theme: 'Monuments, Masterpieces & Seine Panoramas',
      morning: 'Ascend to Trocadéro & Eiffel Tower Viewpoint',
      afternoon: 'Musée d’Orsay Impressionist Gallery',
      evening: 'Dinner & Wine Tasting in Saint-Germain-des-Prés',
      cost: '€90.00 / person',
    },
    {
      day: 3,
      theme: 'Bohemian Charm, Montmartre & Romantic Vistas',
      morning: 'Montmartre & Sacré-Cœur Basilica Visit',
      afternoon: 'Artisanal Pastry Walk & Le Marais Boutiques',
      evening: 'Twilight Stroll Across Pont Alexandre III',
      cost: '€35.00 / person',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold mb-6 shadow-sm border border-indigo-200/50">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Next-Generation Personalized Travel Planning</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
              Make room for <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">wonder.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
              Generate fully personalized, day-by-day travel itineraries in seconds. Wanderwise models your travel pace, calculates authentic category budgets, and schedules non-overlapping daily experiences tailored specifically to you.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
              <Link
                to={isAuthenticated ? "/trips/new" : "/auth?mode=register"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/25 transition-all text-sm"
              >
                <span>Plan Your Next Trip Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleGuestDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all text-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Instant 1-Click Guest Demo</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Zero Fabricated Live Claims</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Authentic Budget Blueprint</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Multi-Currency & Custom Pace</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sample Itinerary Preview */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Interactive Preview</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Experience the Wanderwise Standard
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every generated trip is structured with realistic timing, categorized budgets, and practical neighborhood navigation.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
            {/* Preview Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>PARIS, FRANCE &bull; 4 DAYS &bull; 2 TRAVELERS</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Wanderwise Balanced Journey: Best of Paris
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                  Pace: Balanced (3 acts/day)
                </span>
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
                  Target: €2,500.00
                </span>
              </div>
            </div>

            {/* Day Switcher */}
            <div className="flex items-center gap-2 my-6 overflow-x-auto pb-2">
              {previewDays.map((p) => (
                <button
                  key={p.day}
                  onClick={() => setActivePreviewDay(p.day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activePreviewDay === p.day
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Day {p.day}: {p.theme.split(':')[0]}
                </button>
              ))}
            </div>

            {/* Active Day Content */}
            {previewDays
              .filter((p) => p.day === activePreviewDay)
              .map((p) => (
                <div key={p.day} className="space-y-3">
                  <div className="text-sm font-bold text-slate-800 mb-2">
                    {p.theme}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 uppercase mb-2">
                        <Clock className="w-3.5 h-3.5" /> Morning &bull; 09:30 - 12:00
                      </div>
                      <div className="font-bold text-sm text-slate-900 mb-1">{p.morning}</div>
                      <div className="text-xs text-slate-500">Includes scenic walking path, historical highlights and photo spots.</div>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 uppercase mb-2">
                        <Clock className="w-3.5 h-3.5" /> Afternoon &bull; 13:30 - 16:30
                      </div>
                      <div className="font-bold text-sm text-slate-900 mb-1">{p.afternoon}</div>
                      <div className="text-xs text-slate-500">World-class art collections, royal garden walks, and local cafes.</div>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 uppercase mb-2">
                        <Clock className="w-3.5 h-3.5" /> Evening &bull; 18:30 - 21:00
                      </div>
                      <div className="font-bold text-sm text-slate-900 mb-1">{p.evening}</div>
                      <div className="text-xs text-slate-500">Authentic regional dining suggestions, river twilight, and night vistas.</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Features</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Engineered for Modern Independent Travelers
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Unlike generic chatbot outputs, Wanderwise produces structured, database-persisted travel blueprints with editable activities and budget analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Custom Pace & Travel Style</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whether you prefer a relaxed vacation with 2 leisurely activities a day or a packed itinerary seeing 4 highlights per day, Wanderwise balances transit, rest, and exploration.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-5">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Transparent Budget Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatic category allocations for accommodation, food, activities, local transit, and contingency. Distinguishes per-person vs group costs and alerts if estimates exceed your target.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-5">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Interactive Route Maps</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated OpenStreetMap and Leaflet map displaying real plotted markers for morning, afternoon, and evening activities with one-click Google Maps navigation directions.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Single-Day Regeneration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Want to tweak Day 3 without touching the rest of your trip? Easily re-generate individual days with tailored prompts like "more modern art" or "foodie street markets".
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-5">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Print & Offline Ready</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export to clean print-friendly layouts or download JSON backups. All your trips remain stored safely in your user-isolated database account.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Deterministic Fallback Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Runs reliably anytime. When AI API keys are not provided or experience external timeouts, our high-fidelity curated engine generates complete, authentic itineraries instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works 4-step Section */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">How Wanderwise Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Destination & Dates</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose your dream city and departure/return travel dates up to 30 days.
              </p>
            </div>

            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Travelers & Budget</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Input your party size and total budget in USD, EUR, GBP, JPY, CAD, or AUD.
              </p>
            </div>

            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Style & Interests</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select your pace (relaxed to packed) and tag your passions (food, art, nature).
              </p>
            </div>

            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Generate & Personalize</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive a complete structured timeline. Edit, add activities, or re-order anytime.
              </p>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="mt-16 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to begin your journey?</h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-6">
              Create your first personalized travel itinerary in under 60 seconds with Wanderwise.
            </p>
            <Link
              to={isAuthenticated ? "/trips/new" : "/auth?mode=register"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
