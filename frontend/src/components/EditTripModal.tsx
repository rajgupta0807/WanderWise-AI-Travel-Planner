import React, { useState } from 'react';
import { Trip, TripUpdateInput } from '../types/trip';
import { X, Sparkles } from 'lucide-react';

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TripUpdateInput) => Promise<void>;
  trip: Trip;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({ isOpen, onClose, onSave, trip }) => {
  const [title, setTitle] = useState(trip.title);
  const [budgetAmount, setBudgetAmount] = useState(trip.budget_amount);
  const [travelerCount, setTravelerCount] = useState(trip.traveler_count);
  const [travelStyle, setTravelStyle] = useState(trip.travel_style);
  const [pace, setPace] = useState(trip.pace);
  const [status, setStatus] = useState(trip.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        budget_amount: Number(budgetAmount),
        traveler_count: Number(travelerCount),
        travel_style: travelStyle,
        pace,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Trip Parameters</h3>
              <p className="text-xs text-slate-500">Update budget, pace or travelers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Budget ({trip.currency})</label>
              <input
                type="number"
                min="1"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Traveler Count</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={travelerCount}
                onChange={(e) => setTravelerCount(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Style</label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="budget">Budget Standard</option>
                <option value="balanced">Balanced Standard</option>
                <option value="luxury">Luxury Standard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Pace</label>
              <select
                value={pace}
                onChange={(e) => setPace(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="relaxed">Relaxed (2/day)</option>
                <option value="balanced">Balanced (3/day)</option>
                <option value="packed">Packed (4/day)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="planned">Planned (Upcoming)</option>
              <option value="active">Active (Traveling Now)</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
