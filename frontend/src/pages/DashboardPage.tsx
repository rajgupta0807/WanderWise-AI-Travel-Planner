import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Plus,
  Search,
  Calendar,
  Wallet,
  MapPin,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Plane,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { TripListItem } from '../types/trip';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<TripListItem | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTrips({
        search: search.trim() || undefined,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTrips(res.items);
      setTotalCount(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrips();
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    try {
      await api.deleteTrip(tripToDelete.id);
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip');
    }
  };

  // Compute live real user metrics from user-owned trips
  const upcomingCount = trips.filter(
    (t) => new Date(t.start_date) >= new Date() && t.status !== 'completed'
  ).length;
  const uniqueDestinations = new Set(trips.map((t) => t.destination.toLowerCase())).size;
  const totalBudgetPlanned = trips.reduce((acc, t) => acc + (t.budget_amount || 0), 0);
  const primaryCurrency = trips[0]?.currency || user?.preferred_currency || 'USD';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-8 border-b border-slate-200/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Traveler Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Traveler'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 italic">
              "The world is a book and those who do not travel read only one page." — St. Augustine
            </p>
          </div>

          <Link
            to="/trips/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Plan New Itinerary</span>
          </Link>
        </div>

        {/* Real KPI Statistics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Trips</span>
              <Compass className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Stored in database</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Upcoming Journeys</span>
              <Plane className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{upcomingCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Departures scheduled</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Destinations</span>
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{uniqueDestinations}</div>
            <div className="text-[11px] text-slate-400 mt-1">Cities explored</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Budget</span>
              <Wallet className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {primaryCurrency} {totalBudgetPlanned.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all planned trips</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by destination or title..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'planned', 'active', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split('_');
                setSortBy(by);
                setSortOrder(ord);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="start_date_asc">Departure Date (Soonest)</option>
              <option value="budget_amount_desc">Budget (High to Low)</option>
              <option value="budget_amount_asc">Budget (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Trips Grid / Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold text-sm mb-3">{error}</p>
            <button
              onClick={fetchTrips}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Itineraries Found</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
              {search || statusFilter !== 'all'
                ? 'No trips matched your active search filters. Try clearing your search keywords.'
                : 'You haven’t created any travel itineraries yet. Start planning your personalized adventure now.'}
            </p>
            {search || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/trips/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Trip</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Card Top Banner with Visual Badge */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      {trip.destination} {trip.country ? `• ${trip.country}` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 capitalize backdrop-blur-sm">
                      {trip.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                    {trip.title}
                  </h3>
                  {trip.theme && (
                    <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5 font-medium">
                      {trip.theme}
                    </p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Meta Details */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(trip.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(trip.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="font-semibold text-slate-700">{trip.duration_days} Day{trip.duration_days > 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        Budget Cap
                      </span>
                      <span className="font-bold text-slate-900">
                        {trip.currency} {trip.budget_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Pace / Style:</span>
                      <span className="font-medium capitalize text-slate-600">
                        {trip.pace} &bull; {trip.travel_style}
                      </span>
                    </div>
                  </div>

                  {/* Interests Tags */}
                  {trip.interests && trip.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {trip.interests.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                      {trip.interests.length > 3 && (
                        <span className="text-[10px] text-slate-400 px-1 py-0.5">
                          +{trip.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setTripToDelete(trip);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      to={`/trips/${trip.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all"
                    >
                      <span>Open Itinerary</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Itinerary"
        message={`Are you sure you want to delete "${tripToDelete?.title}"? All scheduled days and activities will be permanently removed.`}
        confirmText="Delete Trip"
        isDestructive={true}
      />
    </div>
  );
};
