import React, { useState } from 'react';
import { FileText, X, Pencil, Calendar, Check, Trash2, AlertCircle } from 'lucide-react';

/**
 * Paper Usage Status Modal (Exact match to User Screenshot media_1795853941371_a57f9fe9.png)
 */
export default function PaperUsageModal({
  isOpen,
  onClose,
  jobCard,
  onSavePaperUsage,
}) {
  if (!isOpen || !jobCard) return null;

  // Calculate default total units from jobCard.jobQty or cover/inner paper count
  const defaultTotal = Math.max(
    1,
    Number(jobCard.paperUsage?.totalUnits) ||
    Number(jobCard.jobQty) ||
    Number(jobCard.coverPaperCount) ||
    1000
  );

  const [totalUnits, setTotalUnits] = useState(defaultTotal);
  const [qtyInput, setQtyInput] = useState('');
  const [operatorInput, setOperatorInput] = useState('Aakash Sharma');
  const [errorMsg, setErrorMsg] = useState('');

  // History from jobCard
  const history = jobCard.paperUsage?.history || [];
  const usedUnits = Number(jobCard.paperUsage?.usedUnits) || history.reduce((sum, item) => sum + (Number(item.usedQty) || 0), 0);
  const remainingUnits = Math.max(0, totalUnits - usedUnits);
  const isCompleted = jobCard.paperUsage?.isCompleted || (usedUnits >= totalUnits && totalUnits > 0);

  const handleAddUsage = () => {
    setErrorMsg('');
    const qty = Number(qtyInput);
    if (!qty || qty <= 0) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }

    const newHistoryItem = {
      usedQty: qty,
      date: new Date().toISOString(),
      operator: operatorInput.trim() || 'Aakash Sharma',
    };

    const newHistory = [newHistoryItem, ...history];
    const newUsedUnits = usedUnits + qty;
    const newRemaining = Math.max(0, totalUnits - newUsedUnits);
    const autoComplete = newUsedUnits >= totalUnits;

    const updatedUsage = {
      totalUnits,
      usedUnits: newUsedUnits,
      remainingUnits: newRemaining,
      isCompleted: autoComplete,
      history: newHistory,
    };

    onSavePaperUsage(updatedUsage);
    setQtyInput('');
  };

  const handleToggleCompleted = () => {
    const updatedUsage = {
      totalUnits,
      usedUnits,
      remainingUnits,
      isCompleted: !isCompleted,
      history,
    };
    onSavePaperUsage(updatedUsage);
  };

  const handleDeleteHistory = (indexToDelete) => {
    const newHistory = history.filter((_, i) => i !== indexToDelete);
    const newUsedUnits = newHistory.reduce((sum, item) => sum + (Number(item.usedQty) || 0), 0);
    const newRemaining = Math.max(0, totalUnits - newUsedUnits);
    const autoComplete = newUsedUnits >= totalUnits && totalUnits > 0;

    const updatedUsage = {
      totalUnits,
      usedUnits: newUsedUnits,
      remainingUnits: newRemaining,
      isCompleted: autoComplete,
      history: newHistory,
    };
    onSavePaperUsage(updatedUsage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Paper Usage Status
              </h2>
              {jobCard.partyName && (
                <p className="text-[11px] text-gray-400 font-medium">
                  Job #{jobCard.jobNumber} · {jobCard.partyName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Top 3 Stat Cards (Exact match to screenshot) */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* TOTAL UNITS Card */}
            <div className="rounded-xl p-3 bg-blue-50/70 border border-blue-100 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                TOTAL UNITS
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mt-1 block">
                {totalUnits.toLocaleString('en-IN')}
              </span>
            </div>

            {/* USED Card */}
            <div className="rounded-xl p-3 bg-rose-50/70 border border-rose-100 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                USED
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mt-1 block">
                {usedUnits.toLocaleString('en-IN')}
              </span>
            </div>

            {/* REMAINING Card */}
            <div className="rounded-xl p-3 bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                REMAINING
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mt-1 block">
                {remainingUnits.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-gray-500 font-medium">
              Current Paper Status:
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isCompleted ? (
                <>
                  <Check size={12} strokeWidth={3} /> Completed
                </>
              ) : (
                <>Pending / In-Progress</>
              )}
            </span>
          </div>

          {/* Qty Used Input & Update Button */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUsage()}
                placeholder="Qty Used..."
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={handleAddUsage}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Pencil size={15} />
                <span>Update</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} /> {errorMsg}
              </p>
            )}
          </div>

          {/* Usage History Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-gray-800 font-bold text-xs">
              <Calendar size={14} className="text-gray-500" />
              <span>Usage History</span>
            </div>

            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3 min-h-[90px] flex flex-col justify-center">
              {history.length === 0 ? (
                <p className="text-center text-gray-400 italic text-xs py-3">
                  No usage recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-2.5 border border-gray-100 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-blue-700">
                          +{Number(item.usedQty).toLocaleString('en-IN')} units
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          {item.operator && `· ${item.operator}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(idx)}
                        className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manual Completion Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
            <span className="text-gray-500">Manual Override:</span>
            <button
              type="button"
              onClick={handleToggleCompleted}
              className={`px-3 py-1 rounded-lg font-bold transition-all border ${
                isCompleted
                  ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
              }`}
            >
              {isCompleted ? 'Mark Pending' : 'Mark as Complete'}
            </button>
          </div>

          {/* Screenshot Footer Note */}
          <p className="text-center text-[10px] text-gray-400 leading-normal font-medium px-4 pt-1">
            Status is automatically marked complete when used quantity meets or exceeds total units.
          </p>
        </div>
      </div>
    </div>
  );
}
