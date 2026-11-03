import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Wallet,
  Users,
  MapPin,
  Clock,
  Plus,
  RefreshCw,
  Printer,
  Download,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Navigation,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Utensils,
  Car,
  Lightbulb,
} from 'lucide-react';
import { api } from '../services/api';
import { Trip, ItineraryDay, Activity, TripUpdateInput } from '../types/trip';
import { BudgetCard } from '../components/BudgetCard';
import { MapComponent } from '../components/MapComponent';
import { ActivityModal } from '../components/ActivityModal';
import { EditTripModal } from '../components/EditTripModal';
import { RegenerateDayModal } from '../components/RegenerateDayModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const ItineraryDetailPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Modals state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [targetDayId, setTargetDayId] = useState<string | null>(null);

  const [editTripModalOpen, setEditTripModalOpen] = useState(false);
  const [regenDayModalOpen, setRegenDayModalOpen] = useState(false);
  const [regenFullConfirmOpen, setRegenFullConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [isRegeneratingFull, setIsRegeneratingFull] = useState(false);

  const fetchTrip = async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTrip(tripId);
      setTrip(data);
    } catch (err: any) {
      setError(err.message || 'Could not load itinerary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center">
        <div className="max-w-4xl w-full space-y-6 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-44 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-lg mb-1">Itinerary Unavailable</h3>
          <p className="text-xs text-slate-500 mb-6">{error || 'Trip record was not found or was deleted.'}</p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
          >
            Back to My Trips
          </Link>
        </div>
      </div>
    );
  }

  const activeDay = trip.days[activeDayIndex] || trip.days[0];

  // Handlers
  const handleUpdateTrip = async (data: TripUpdateInput) => {
    const updated = await api.updateTrip(trip.id, data);
    setTrip(updated);
  };

  const handleRegenerateFull = async () => {
    setIsRegeneratingFull(true);
    try {
      const refreshed = await api.regenerateFullTrip(trip.id);
      setTrip(refreshed);
    } catch (err: any) {
      alert(err.message || 'Full itinerary regeneration failed');
    } finally {
      setIsRegeneratingFull(false);
    }
  };

  const handleRegenerateDay = async (focus: string) => {
    if (!activeDay) return;
    const updatedDay = await api.regenerateDay(trip.id, activeDay.id, focus);
    setTrip((prev) => {
      if (!prev) return null;
      const newDays = prev.days.map((d) => (d.id === updatedDay.id ? updatedDay : d));
      return { ...prev, days: newDays };
    });
  };

  const handleSaveActivity = async (actData: Partial<Activity>) => {
    if (editingActivity) {
      const updated = await api.updateActivity(trip.id, editingActivity.id, actData);
      setTrip((prev) => {
        if (!prev) return null;
        const newDays = prev.days.map((d) => {
          if (d.id === updated.itinerary_day_id) {
            return {
              ...d,
              activities: d.activities.map((a) => (a.id === updated.id ? updated : a)),
            };
          }
          return d;
        });
        return { ...prev, days: newDays };
      });
    } else if (targetDayId) {
      const created = await api.createActivity(trip.id, targetDayId, actData);
      setTrip((prev) => {
        if (!prev) return null;
        const newDays = prev.days.map((d) => {
          if (d.id === targetDayId) {
            return {
              ...d,
              activities: [...d.activities, created],
            };
          }
          return d;
        });
        return { ...prev, days: newDays };
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    await api.deleteActivity(trip.id, activityId);
    setTrip((prev) => {
      if (!prev) return null;
      const newDays = prev.days.map((d) => ({
        ...d,
        activities: d.activities.filter((a) => a.id !== activityId),
      }));
      return { ...prev, days: newDays };
    });
  };

  const handleMoveActivity = async (dayId: string, activityId: string, direction: 'up' | 'down') => {
    const day = trip.days.find((d) => d.id === dayId);
    if (!day) return;
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= day.activities.length) return;

    const currAct = day.activities[idx];
    const swapAct = day.activities[targetIdx];

    // Optimistically update sort orders
    await api.updateActivity(trip.id, currAct.id, { sort_order: targetIdx });
    await api.updateActivity(trip.id, swapAct.id, { sort_order: idx });
    fetchTrip();
  };

  const handleDeleteTrip = async () => {
    await api.deleteTrip(trip.id);
    navigate('/dashboard');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wanderwise-${trip.destination.toLowerCase()}-itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Extract all activities across all days for overall route mapping
  const allActivities = trip.days.flatMap((d) => d.activities);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print-page">
      <div className="max-w-6xl mx-auto">
        {/* Back Link & Quick Actions (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
          >
            &larr; Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
              title="Print Itinerary"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              onClick={() => setEditTripModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Trip</span>
            </button>

            <button
              onClick={() => setRegenFullConfirmOpen(true)}
              disabled={isRegeneratingFull}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingFull ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerate Trip</span>
            </button>

            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive Trip Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-bold text-indigo-300">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-300" />
              {trip.destination} {trip.country ? `• ${trip.country}` : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 uppercase tracking-wider">
              {trip.duration_days} Days
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 uppercase tracking-wider">
              {trip.traveler_count} Traveler{trip.traveler_count > 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 uppercase tracking-wider capitalize">
              {trip.travel_style} Standard &bull; {trip.pace} Pace
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            {trip.title}
          </h1>

          {trip.theme && (
            <p className="text-sm font-semibold text-indigo-200 mb-3">
              {trip.theme}
            </p>
          )}

          {trip.summary && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {trip.summary}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>
                {new Date(trip.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} –{' '}
                {new Date(trip.end_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Target Budget: <strong>{trip.currency} {trip.budget_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>
        </div>

        {/* Budget Financial Blueprint Card */}
        {trip.budget_breakdown && (
          <BudgetCard budget={trip.budget_breakdown} />
        )}

        {/* Interactive Destination Map Component */}
        <div className="mb-8">
          <MapComponent destination={trip.destination} activities={allActivities} />
        </div>

        {/* Day-by-Day Interactive Timeline */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm mb-12">
          {/* Day Navigation Tabs */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              {trip.days.map((day, idx) => (
                <button
                  key={day.id}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeDayIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  Day {day.day_number}
                </button>
              ))}
            </div>

            <button
              onClick={() => setRegenDayModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Regenerate Day {activeDay?.day_number}</span>
            </button>
          </div>

          {/* Active Day Header */}
          {activeDay && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                    DAY {activeDay.day_number} &bull; {new Date(activeDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{activeDay.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">{activeDay.summary}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Day Est. Subtotal</div>
                  <div className="text-lg font-black text-slate-900">
                    {trip.currency} {activeDay.estimated_total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Day Logistics Pill Boxes: Dining, Transport, Practical Tips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {activeDay.dining_suggestions && activeDay.dining_suggestions.length > 0 && (
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1.5">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      Dining Ideas
                    </div>
                    <ul className="text-[11px] text-emerald-900 space-y-1">
                      {activeDay.dining_suggestions.map((din, idx) => (
                        <li key={idx} className="leading-snug">&bull; {din}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeDay.transport_guidance && (
                  <div className="p-3.5 bg-sky-50/50 border border-sky-100 rounded-2xl text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1.5">
                      <Car className="w-3.5 h-3.5 text-sky-600" />
                      Transit Logistics
                    </div>
                    <p className="text-[11px] text-sky-900 leading-snug">{activeDay.transport_guidance}</p>
                  </div>
                )}

                {activeDay.practical_tips && (
                  <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Practical Tips
                    </div>
                    <p className="text-[11px] text-amber-900 leading-snug">{activeDay.practical_tips}</p>
                  </div>
                )}
              </div>

              {/* Activities Section */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Experiences ({activeDay.activities.length})
                  </h4>

                  <button
                    onClick={() => {
                      setEditingActivity(null);
                      setTargetDayId(activeDay.id);
                      setActivityModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Activity</span>
                  </button>
                </div>

                {activeDay.activities.length === 0 ? (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                    No activities scheduled for this day yet. Click "Add Activity" or "Regenerate Day" above.
                  </div>
                ) : (
                  activeDay.activities.map((act, aIdx) => (
                    <div
                      key={act.id}
                      className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-200 transition-all group"
                    >
                      {/* Left: Timing & Type */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-sm ${
                            act.activity_type === 'morning'
                              ? 'bg-blue-500'
                              : act.activity_type === 'afternoon'
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                          }`}
                        >
                          {aIdx + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {act.start_time} - {act.end_time}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 capitalize">
                              {act.activity_type}
                            </span>
                          </div>

                          <h5 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {act.title}
                          </h5>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {act.description}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-500" />
                              {act.location_name}
                            </span>

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(act.location_name + ', ' + trip.destination)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>Directions</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right: Cost & Operations */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Cost</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {act.currency} {act.estimated_cost.toFixed(2)}
                          </div>
                        </div>

                        {/* Actions: Reorder, Edit, Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveActivity(activeDay.id, act.id, 'up')}
                            disabled={aIdx === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveActivity(activeDay.id, act.id, 'down')}
                            disabled={aIdx === activeDay.activities.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingActivity(act);
                              setTargetDayId(activeDay.id);
                              setActivityModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600"
                            title="Edit Activity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSave={handleSaveActivity}
        activity={editingActivity}
        dayNumber={activeDay?.day_number || 1}
        currency={trip.currency}
      />

      <EditTripModal
        isOpen={editTripModalOpen}
        onClose={() => setEditTripModalOpen(false)}
        onSave={handleUpdateTrip}
        trip={trip}
      />

      <RegenerateDayModal
        isOpen={regenDayModalOpen}
        onClose={() => setRegenDayModalOpen(false)}
        onConfirm={handleRegenerateDay}
        dayNumber={activeDay?.day_number || 1}
      />

      <ConfirmModal
        isOpen={regenFullConfirmOpen}
        onClose={() => setRegenFullConfirmOpen(false)}
        onConfirm={handleRegenerateFull}
        title="Regenerate Full Itinerary?"
        message="This will regenerate the entire day-by-day plan and reset any custom edits made to individual activities."
        confirmText="Yes, Regenerate Full Trip"
        isDestructive={false}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTrip}
        title="Delete Itinerary"
        message="Are you sure you want to delete this trip permanently?"
        confirmText="Delete Itinerary"
        isDestructive={true}
      />
    </div>
  );
};
