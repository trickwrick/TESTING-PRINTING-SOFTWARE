import React, { useMemo } from 'react';
import { Check, Settings, Image as ImageIcon } from 'lucide-react';

/**
 * 4 Main steps matching user screenshot
 */
export const DEFAULT_WORKFLOW_STEPS = [
  { id: 1, title: 'Design & Proof', desc: 'Artwork, design & client approval' },
  { id: 2, title: 'Printing', desc: 'Plate making & print production' },
  { id: 3, title: 'Binding & Finish', desc: 'Cutting, folding & binding' },
  { id: 4, title: 'QC & Delivery', desc: 'Quality check, packing & dispatch' },
];

/**
 * Modern Multi-step Workflow Progress Stepper (Exact match to User Screenshot)
 *
 * Visual Features:
 * - Clean light grey continuous track
 * - Steps 1, 2, 3, 4 with blue active ring & filled states
 * - Inter-step nodes: "PAPER" with gear icon, "CHALLAN PROOF" with image icon
 * - Pill action buttons "MARK DONE" / "UNDO"
 * - Right side "TIME LEFT" card (e.g. 5 days) with pink/red styling
 */
export default function WorkflowProgressLine({
  steps = DEFAULT_WORKFLOW_STEPS,
  currentStep = 0,               // e.g. 0 = none, 1 = Step 1 done, etc.
  onStepChange,                  // Callback: (newStepNo, stepData) => void
  completedByMap = {},           // Optional: { 1: "Aakash Sharma" }
  canEdit = true,
  timeLeftDays = 5,              // Optional time left counter
  onPaperNodeClick = null,       // Optional click on PAPER gear node
  onChallanProofClick = null,    // Optional click on CHALLAN PROOF node
  className = '',
}) {
  const totalSteps = steps.length;

  const handleStepClick = (stepNo) => {
    if (!canEdit || !onStepChange) return;
    // Toggle behavior: clicking active/completed step undoes, clicking pending advances
    const targetStep = currentStep === stepNo ? stepNo - 1 : stepNo;
    onStepChange(targetStep, steps[targetStep - 1] || null);
  };

  return (
    <div className={`w-full py-4 px-3 sm:px-6 bg-white select-none ${className}`}>
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
        {/* Main Steps Pipeline Line Wrap */}
        <div className="relative flex-1 min-w-[700px] flex items-start justify-between px-6 pt-1">
          {/* Background Connecting Line */}
          <div className="absolute left-[8%] right-[8%] top-[19px] h-[2px] bg-gray-200 z-0" />

          {/* STEP 1: Design & Proof */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handleStepClick(1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                canEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${
                currentStep >= 1
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {currentStep >= 1 ? <Check size={16} strokeWidth={3.5} /> : '1'}
            </button>
            <p className="mt-2.5 text-xs font-black text-gray-900 leading-tight">
              Design &amp; Proof
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 font-medium leading-tight">
              Artwork, design &amp; client approval
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => handleStepClick(1)}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                  currentStep >= 1
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {currentStep >= 1 ? 'Undo' : 'MARK DONE'}
              </button>
            )}
          </div>

          {/* STEP 2: Printing */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handleStepClick(2)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                canEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${
                currentStep >= 2
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 1
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {currentStep >= 2 ? <Check size={16} strokeWidth={3.5} /> : '2'}
            </button>
            <p className="mt-2.5 text-xs font-black text-gray-900 leading-tight">
              Printing
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 font-medium leading-tight">
              Plate making &amp; print production
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => handleStepClick(2)}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                  currentStep >= 2
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : currentStep === 1
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {currentStep >= 2 ? 'Undo' : 'MARK DONE'}
              </button>
            )}
          </div>

          {/* MIDDLE NODE: PAPER (Gear Icon) */}
          <div className="relative z-10 flex flex-col items-center text-center w-20 pt-0.5">
            <button
              type="button"
              onClick={onPaperNodeClick}
              title="Paper Details"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-blue-500 hover:text-blue-700 hover:border-blue-300 transition-all hover:scale-105 cursor-pointer"
            >
              <Settings size={15} />
            </button>
            <span className="mt-2.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
              PAPER
            </span>
          </div>

          {/* STEP 3: Binding & Finish */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handleStepClick(3)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                canEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${
                currentStep >= 3
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 2
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {currentStep >= 3 ? <Check size={16} strokeWidth={3.5} /> : '3'}
            </button>
            <p className="mt-2.5 text-xs font-black text-gray-900 leading-tight">
              Binding &amp; Finish
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 font-medium leading-tight">
              Cutting, folding &amp; binding
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => handleStepClick(3)}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                  currentStep >= 3
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : currentStep === 2
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {currentStep >= 3 ? 'Undo' : 'MARK DONE'}
              </button>
            )}
          </div>

          {/* MIDDLE NODE: CHALLAN PROOF (Image icon) */}
          <div className="relative z-10 flex flex-col items-center text-center w-24 pt-0.5">
            <button
              type="button"
              onClick={onChallanProofClick}
              title="Challan Proof Document"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all hover:scale-105 cursor-pointer"
            >
              <ImageIcon size={15} />
            </button>
            <span className="mt-2.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
              CHALLAN PROOF
            </span>
          </div>

          {/* STEP 4: QC & Delivery */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handleStepClick(4)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                canEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${
                currentStep >= 4
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 3
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {currentStep >= 4 ? <Check size={16} strokeWidth={3.5} /> : '4'}
            </button>
            <p className="mt-2.5 text-xs font-black text-gray-900 leading-tight">
              QC &amp; Delivery
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 font-medium leading-tight">
              Quality check, packing &amp; dispatch
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => handleStepClick(4)}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                  currentStep >= 4
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : currentStep === 3
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {currentStep >= 4 ? 'Undo' : 'MARK DONE'}
              </button>
            )}
          </div>
        </div>

        {/* TIME LEFT Badge Card (Matching user screenshot) */}
        <div className="shrink-0 pl-2 pr-2">
          <div className="w-24 h-24 rounded-2xl bg-red-50/70 border border-red-100 flex flex-col items-center justify-center text-center shadow-2xs">
            <span className="text-[10px] font-black text-rose-600 tracking-wider uppercase">
              TIME LEFT
            </span>
            <span className="text-3xl font-black text-rose-600 leading-none my-0.5">
              {timeLeftDays}
            </span>
            <span className="text-[10px] font-bold text-rose-500 lowercase">
              days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
