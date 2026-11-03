import React from 'react';
import { Compass, Heart, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">Wanderwise</span>
            </div>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed mb-4">
              "Make room for wonder." Precision AI-powered personalized travel itineraries with authentic budget calculations, realistic pace modeling, and interactive maps.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Stack Architecture &bull; FastAPI & SQLite/PostgreSQL &bull; AI-assisted itinerary planning</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white transition-colors">Platform Overview</Link></li>
              <li><Link to="/trips/new" className="hover:text-white transition-colors">Trip Wizard</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Saved Itineraries</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Preferences & API Mode</Link></li>
            </ul>
          </div>

          {/* Engine & Stack */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Architecture</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-400" /> FastAPI 0.112+</li>
              <li>React 18 + TypeScript + Vite</li>
              <li>Tailwind CSS + Leaflet</li>
              <li>SQLAlchemy 2.0 + Alembic</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>&copy; {new Date().getFullYear()} Wanderwise Travel Planner. Built for production demonstration.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 inline fill-current" />
            <span>for curious travelers worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
