import React, { useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

interface RegenerateDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (focusPrompt: string) => Promise<void>;
  dayNumber: number;
}

export const RegenerateDayModal: React.FC<RegenerateDayModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  dayNumber,
}) => {
  const [focus, setFocus] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!isOpen) return null;

  const suggestions = [
    'Art, Galleries & Architecture',
    'Foodie Tasting & Hidden Neighborhood Cafes',
    'Outdoor Parks, Riverside & Nature Walk',
    'Iconic Historic Landmarks & Panoramas',
    'Leisurely Relaxation & Local Markets'
  ];

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegenerating(true);
    try {
      await onConfirm(focus);
      onClose();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Regenerate Day {dayNumber}</h3>
              <p className="text-xs text-slate-500">Refreshes only this day's timeline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRegenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Specific Vibe or Focus Preference (Optional)
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. more local bakeries, modern art, scenic photography spots"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFocus(sug)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    focus === sug
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isRegenerating}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Regenerate Day
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
