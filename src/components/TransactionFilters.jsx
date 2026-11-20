import React, { useState } from 'react';
import { Filter, X, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

const CATEGORY_OPTIONS = [
  { value: 'opening_balance', label: 'Opening Balance' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'interest', label: 'Interest' },
  { value: 'fee', label: 'Fee' },
  { value: 'adjustment', label: 'Adjustment' },
];

const DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function TransactionFilters({ onFilter }) {
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [category, setCategory] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  function getDateRange() {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return customStart && customEnd ? { start: new Date(customStart), end: new Date(customEnd) } : null;
      default:
        return null;
    }
  }

  function handleApply() {
    const range = getDateRange();
    const cat = category === 'all' ? null : category;
    onFilter({ dateRange: range, category: cat, amountMin, amountMax });
    setShowFilters(false);
  }

  function handleReset() {
    setDateRange('all');
    setCategory('all');
    setCustomStart('');
    setCustomEnd('');
    setAmountMin('');
    setAmountMax('');
    onFilter({ dateRange: null, category: null, amountMin: '', amountMax: '' });
    setShowFilters(false);
  }

  const activeFilters = (dateRange !== 'all' || category !== 'all' || amountMin !== '' || amountMax !== '') ? 1 : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all border ${
          activeFilters > 0
            ? 'bg-brass/10 text-brass border-brass/30'
            : 'bg-white text-gray border-slate-200 hover:border-brass/30'
        }`}
      >
        <Filter size={13} />
        Filter
        {activeFilters > 0 && <span className="ml-0.5 w-4 h-4 bg-brass text-white text-[9px] rounded-full flex items-center justify-center font-bold">{activeFilters}</span>}
      </button>

      {showFilters && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl p-4 w-72 shadow-xl z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground font-semibold text-sm flex items-center gap-2">
                <Filter size={14} className="text-brass" />
                Filter Transactions
              </h3>
              <button onClick={() => setShowFilters(false)} className="text-gray hover:text-foreground">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="text-gray text-[10px] uppercase tracking-wider mb-2 block font-medium">Date Range</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DATE_PRESETS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDateRange(opt.value)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        dateRange === opt.value
                          ? 'bg-brass text-white'
                          : 'bg-slate-50 text-gray hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-gray text-[10px] mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-foreground text-sm focus:border-brass/40 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray text-[10px] mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-foreground text-sm focus:border-brass/40 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="text-gray text-[10px] uppercase tracking-wider mb-2 block font-medium">Transaction Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setCategory('all')}
                    className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      category === 'all' ? 'bg-brass text-white' : 'bg-slate-50 text-gray hover:bg-slate-100'
                    }`}
                  >
                    All Types
                  </button>
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCategory(opt.value)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        category === opt.value ? 'bg-brass text-white' : 'bg-slate-50 text-gray hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-gray text-[10px] uppercase tracking-wider mb-2 block font-medium">Amount Range (USD)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amountMin}
                    onChange={e => setAmountMin(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-foreground text-sm focus:border-brass/40 focus:bg-white focus:outline-none"
                  />
                  <span className="text-gray text-xs">–</span>
                  <input
                    type="number"
                    value={amountMax}
                    onChange={e => setAmountMax(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-foreground text-sm focus:border-brass/40 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 bg-slate-100 text-gray rounded-lg text-xs font-medium hover:bg-slate-200 transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 bg-brass text-white rounded-lg text-xs font-semibold hover:bg-brass/90 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}