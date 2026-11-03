import React, { useState, useEffect } from 'react';
import { User, Mail, DollarSign, Database, Cpu, ShieldCheck, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [healthInfo, setHealthInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPreferredCurrency(user.preferred_currency || 'USD');
    }
    // Fetch backend system diagnostics
    api.health().then((h) => setHealthInfo(h)).catch(() => {});
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        preferred_currency: preferredCurrency,
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profile & Preferences</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your traveler identity and environment configuration</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
          {success && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read Only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={user?.email || 'demo@wanderwise.travel'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Display Currency</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* System Diagnostics & Architecture Badges */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Architecture & Engine Connectivity Status</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  Database Mode
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                  {healthInfo?.database?.mode || 'checking'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {healthInfo?.database?.status === 'ok'
                  ? `Database connection healthy (${healthInfo.database.mode}).`
                  : 'Checking database connection…'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Planning Engine
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  {healthInfo?.ai_engine?.mode || 'checking'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Model: <strong>{healthInfo?.ai_engine?.model || 'checking'}</strong>. {healthInfo?.ai_engine?.mode === 'api' ? 'Connected to the configured AI provider.' : 'Using the built-in itinerary templates; no AI API key is required.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Signed in as <strong>{user?.email || 'demo@wanderwise.travel'}</strong>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
