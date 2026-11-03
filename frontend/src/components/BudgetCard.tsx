import React from 'react';
import { BudgetCalculation } from '../types/trip';
import { Wallet, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface BudgetCardProps {
  budget: BudgetCalculation;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget }) => {
  const categoryColors: Record<string, string> = {
    'Accommodation': 'bg-indigo-500',
    'Food & Dining': 'bg-emerald-500',
    'Attractions & Activities': 'bg-amber-500',
    'Local Transportation': 'bg-sky-500',
    'Miscellaneous & Shopping': 'bg-purple-500',
    'Emergency Contingency (7%)': 'bg-rose-400',
  };

  const percentOfBudget = Math.min(100, Math.round((budget.estimated_total / budget.budget_target) * 100));

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Trip Financial Blueprint</h3>
            <p className="text-xs text-slate-500">Comprehensive cost breakdown computed for {budget.traveler_count} traveler{budget.traveler_count > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {budget.is_over_budget ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Over Target by {budget.currency} {Math.abs(budget.difference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Under Budget ({budget.currency} {budget.difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining)
            </div>
          )}
        </div>
      </div>

      {/* Warning Notice if Over Budget */}
      {budget.warnings && budget.warnings.length > 0 && (
        <div className="mt-4 p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            {budget.warnings.map((w, i) => (
              <p key={i} className="leading-relaxed">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Target Budget</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {budget.currency} {budget.budget_target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">Total planned cap</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Estimated Total</span>
          <div className={`text-xl font-extrabold mt-1 ${budget.is_over_budget ? 'text-rose-600' : 'text-indigo-600'}`}>
            {budget.currency} {budget.estimated_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">{percentOfBudget}% of target</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Per Person Est.</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {budget.currency} {budget.per_person_estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">Target: {budget.currency} {budget.per_person_target.toFixed(2)}</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Daily Average</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {budget.currency} {budget.daily_average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">Group cost per day</span>
        </div>
      </div>

      {/* Progress Bar of Categories */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-600 mb-2 font-medium">
          <span>Allocation Distribution</span>
          <span>100% of Estimated Cost</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {budget.categories.map((cat, idx) => (
            <div
              key={idx}
              className={`${categoryColors[cat.category] || 'bg-slate-400'} transition-all`}
              style={{ width: `${cat.percentage}%` }}
              title={`${cat.category}: ${cat.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {budget.categories.map((cat, idx) => (
          <div key={idx} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-start gap-3">
            <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${categoryColors[cat.category] || 'bg-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="truncate">{cat.category}</span>
                <span className="text-slate-900 ml-2 font-mono">{budget.currency} {cat.amount.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{cat.description}</div>
              <span className="text-[10px] text-slate-400 font-medium">{cat.percentage}% of total</span>
            </div>
          </div>
        ))}
      </div>

      {/* Assumptions Footer */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-600 mb-0.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          Transparent Planning Assumptions:
        </div>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          {budget.assumptions.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
