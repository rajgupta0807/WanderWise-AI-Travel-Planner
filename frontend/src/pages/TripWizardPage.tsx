import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Heart,
  Activity as ActivityIcon,
  ShoppingBag,
  Moon,
  Trees,
  Utensils,
  Landmark,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { TripCreateInput } from '../types/trip';

export const TripWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('Initiating Wanderwise architect...');
  const [error, setError] = useState<string | null>(null);

  // Form State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 14);
  const defaultStart = tomorrow.toISOString().split('T')[0];
  const returnDate = new Date(tomorrow);
  returnDate.setDate(returnDate.getDate() + 4);
  const defaultEnd = returnDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState<TripCreateInput>({
    destination: '',
    country: '',
    start_date: defaultStart,
    end_date: defaultEnd,
    traveler_count: 2,
    budget_amount: 2400,
    currency: 'USD',
    travel_style: 'balanced',
    pace: 'balanced',
    interests: ['sightseeing', 'food', 'culture'],
    accommodation_preferences: 'Boutique hotel in central area',
    dietary_requirements: 'none',
    accessibility_requirements: 'none',
    special_requests: '',
  });

  const availableInterests = [
    { id: 'sightseeing', label: 'Sightseeing & Landmarks', icon: Landmark },
    { id: 'food', label: 'Food & Dining', icon: Utensils },
    { id: 'culture', label: 'Culture & History', icon: Compass },
    { id: 'nature', label: 'Nature & Parks', icon: Trees },
    { id: 'adventure', label: 'Adventure & Sports', icon: ActivityIcon },
    { id: 'shopping', label: 'Boutiques & Shopping', icon: ShoppingBag },
    { id: 'nightlife', label: 'Nightlife & Lounges', icon: Moon },
    { id: 'relaxation', label: 'Wellness & Relaxation', icon: Coffee },
  ];

  const toggleInterest = (id: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(id);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== id) };
      } else {
        return { ...prev, interests: [...prev.interests, id] };
      }
    });
  };

  // Step Validation
  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.destination.trim()) {
        setError('Please enter a destination city or region');
        return false;
      }
      if (!formData.start_date || !formData.end_date) {
        setError('Please select valid departure and return dates');
        return false;
      }
      const s = new Date(formData.start_date);
      const e = new Date(formData.end_date);
      if (e < s) {
        setError('Return date must be on or after departure date');
        return false;
      }
      const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
      if (diffDays > 30) {
        setError(`Trip duration is ${diffDays} days. Maximum allowed is 30 days.`);
        return false;
      }
    } else if (currentStep === 2) {
      if (formData.traveler_count < 1 || formData.traveler_count > 50) {
        setError('Traveler count must be between 1 and 50');
        return false;
      }
      if (formData.budget_amount <= 0) {
        setError('Please enter a valid positive budget amount');
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.interests.length === 0) {
        setError('Please select at least one travel interest or passion');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const calculateDuration = () => {
    const s = new Date(formData.start_date);
    const e = new Date(formData.end_date);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    // Simulate realistic generation stage messaging
    const phases = [
      `Analyzing geographic points of interest in ${formData.destination}...`,
      `Structuring optimal ${formData.pace} pacing for ${calculateDuration()} days...`,
      `Calculating authentic category budget in ${formData.currency}...`,
      'Finalizing your customized Wanderwise itinerary...',
    ];

    let phaseIdx = 0;
    const interval = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % phases.length;
      setGenerationPhase(phases[phaseIdx]);
    }, 1800);

    try {
      const createdTrip = await api.createTrip(formData);
      clearInterval(interval);
      navigate(`/trips/${createdTrip.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Itinerary generation failed. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>STEP {step} OF 5</span>
            <span className="text-indigo-600 font-bold">
              {step === 1 && 'Destination & Dates'}
              {step === 2 && 'Travelers & Budget'}
              {step === 3 && 'Style & Interests'}
              {step === 4 && 'Preferences & Dietary'}
              {step === 5 && 'Review & Generate'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Destination & Dates */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Where and when are you traveling?</h2>
                <p className="text-xs text-slate-500">Pick your destination and travel dates</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Paris, Tokyo, New York, Rome, Barcelona, Bali"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country (Optional)</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. France, Japan, Italy"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center justify-between">
                <span>Calculated Trip Duration:</span>
                <span className="font-bold">{calculateDuration()} Day{calculateDuration() > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* STEP 2: Travelers & Budget */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Travelers & Financial Plan</h2>
                <p className="text-xs text-slate-500">Configure party size and total target budget</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Travelers</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.traveler_count}
                    onChange={(e) => setFormData({ ...formData, traveler_count: parseInt(e.target.value) || 1 })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Target Budget *</label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      min="50"
                      step="10"
                      required
                      value={formData.budget_amount}
                      onChange={(e) => setFormData({ ...formData, budget_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="USD">USD ($) — United States Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="JPY">JPY (¥) — Japanese Yen</option>
                    <option value="CAD">CAD ($) — Canadian Dollar</option>
                    <option value="AUD">AUD ($) — Australian Dollar</option>
                    <option value="INR">INR (₹) — Indian Rupee</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex justify-between">
                <span>Estimated Target per Traveler:</span>
                <span className="font-bold text-slate-900">
                  {formData.currency} {(formData.budget_amount / Math.max(1, formData.traveler_count)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Travel Style, Pace & Interests */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Travel Style & Pacing</h2>
                <p className="text-xs text-slate-500">Fine-tune the rhythm and focal points of your journey</p>
              </div>

              {/* Travel Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Travel Standard</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'budget', title: 'Budget', desc: 'Hostels, transit, street food' },
                    { id: 'balanced', title: 'Balanced', desc: '3-4★ hotels, bistros, tours' },
                    { id: 'luxury', title: 'Luxury', desc: '5★ resorts, fine dining, private' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, travel_style: st.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        formData.travel_style === st.id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 capitalize">{st.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Pace */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Daily Pace</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'relaxed', title: 'Relaxed', desc: '2 activities/day + buffer' },
                    { id: 'balanced', title: 'Balanced', desc: '3 activities/day' },
                    { id: 'packed', title: 'Packed', desc: '4 activities/day + evening' },
                  ].map((pc) => (
                    <button
                      key={pc.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, pace: pc.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        formData.pace === pc.id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 capitalize">{pc.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{pc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Interests & Passions (Choose any)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {availableInterests.map((interest) => {
                    const Icon = interest.icon;
                    const isSelected = formData.interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{interest.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Accommodations, Dietary, Accessibility */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Lodging & Requirements</h2>
                <p className="text-xs text-slate-500">Provide preferences for dining and special needs</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accommodation Preference</label>
                <input
                  type="text"
                  value={formData.accommodation_preferences}
                  onChange={(e) => setFormData({ ...formData, accommodation_preferences: e.target.value })}
                  placeholder="e.g. Boutique hotel, vacation rental, central 4-star"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Requirements</label>
                  <select
                    value={formData.dietary_requirements}
                    onChange={(e) => setFormData({ ...formData, dietary_requirements: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="none">No Restrictions</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="halal">Halal</option>
                    <option value="kosher">Kosher</option>
                    <option value="gluten-free">Gluten-Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Accessibility Needs</label>
                  <select
                    value={formData.accessibility_requirements}
                    onChange={(e) => setFormData({ ...formData, accessibility_requirements: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="none">Standard Mobility</option>
                    <option value="wheelchair">Wheelchair Accessible</option>
                    <option value="low-walking">Low Walking / Step-Free</option>
                    <option value="elevator">Elevator Access Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requests (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.special_requests || ''}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  placeholder="e.g. Celebrating an anniversary, prefer riverfront dinners, avoid crowded early mornings..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Review & Generate */}
          {step === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Review Your Itinerary Blueprint</h2>
                <p className="text-xs text-slate-500">Confirm details before generating your personalized itinerary</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.destination} {formData.country ? `(${formData.country})` : ''}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Travel Dates & Duration:</span>
                  <span className="font-semibold text-slate-800">
                    {formData.start_date} to {formData.end_date} ({calculateDuration()} Days)
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Party & Budget Target:</span>
                  <span className="font-semibold text-slate-800">
                    {formData.traveler_count} Traveler{formData.traveler_count > 1 ? 's' : ''} &bull; {formData.currency} {formData.budget_amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Style & Pace:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {formData.travel_style} Standard &bull; {formData.pace} Pace
                  </span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Interests:</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                    {formData.interests.map((i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] capitalize font-medium">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                {formData.special_requests && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">Special Notes:</span>
                    <p className="text-slate-700 italic">{formData.special_requests}</p>
                  </div>
                )}
              </div>

              {isGenerating ? (
                <div className="p-8 text-center bg-indigo-50/70 border border-indigo-100 rounded-2xl animate-pulse">
                  <Sparkles className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Crafting Your Wanderwise Blueprint</h4>
                  <p className="text-xs text-indigo-700 font-medium">{generationPhase}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Itinerary</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
