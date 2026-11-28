import React from 'react';
import { Check, Settings, Image as ImageIcon, Lock, AlertCircle } from 'lucide-react';

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
 * Requirements:
 * 1. "smood open ho": Smooth animation & transition classes.
 * 2. "mark done 1 1 kr kai ho jay": Strict sequential step progression (Step 1 -> Step 2 -> Paper -> Step 3 -> Proof -> Step 4).
 * 3. "paper yha jb tak na select ho aage na jay": Step 3 cannot be marked done until Paper usage is completed.
 * 4. "chhalan proof image uplod ho ske": Challan Proof node with upload badge and modal trigger.
 */
export default function WorkflowProgressLine({
  steps = DEFAULT_WORKFLOW_STEPS,
  currentStep = 0,               // 0 = none, 1 = Step 1 done, 2 = Step 2 done, etc.
  onStepChange,                  // Callback: (newStepNo, stepData) => void
  completedByMap = {},           // Optional: { 1: "Aakash Sharma" }
  canEdit = true,
  timeLeftDays = 5,              // Optional time left counter
  isPaperCompleted = false,      // Boolean: has paper usage been recorded & marked complete?
  hasChallanProof = false,       // Boolean: is challan proof image uploaded?
  onPaperNodeClick = null,       // Optional click on PAPER gear node
  onChallanProofClick = null,    // Optional click on CHALLAN PROOF node
  className = '',
}) {
  // Step 1 Click
  const handleStep1Click = () => {
    if (!canEdit || !onStepChange) return;
    if (currentStep >= 1) {
      // Undo Step 1 (only if step 2 is not completed yet)
      if (currentStep === 1) {
        onStepChange(0, null);
      }
    } else {
      // Mark Step 1 Done
      onStepChange(1, steps[0]);
    }
  };

  // Step 2 Click
  const handleStep2Click = () => {
    if (!canEdit || !onStepChange) return;
    if (currentStep < 1) {
      // Locked: Step 1 must be completed first
      return;
    }
    if (currentStep >= 2) {
      // Undo Step 2 (only if step 3 is not completed yet)
      if (currentStep === 2) {
        onStepChange(1, steps[0]);
      }
    } else if (currentStep === 1) {
      // Mark Step 2 Done
      onStepChange(2, steps[1]);
    }
  };

  // Step 3 Click (Blocked by Paper Usage!)
  const handleStep3Click = () => {
    if (!canEdit || !onStepChange) return;
    if (currentStep < 2) {
      // Locked: Step 2 must be completed first
      return;
    }

    // Gate: Paper must be completed before Step 3 can be marked done
    if (!isPaperCompleted && currentStep === 2) {
      if (onPaperNodeClick) {
        onPaperNodeClick();
      }
      return;
    }

    if (currentStep >= 3) {
      // Undo Step 3 (only if step 4 is not completed yet)
      if (currentStep === 3) {
        onStepChange(2, steps[1]);
      }
    } else if (currentStep === 2) {
      // Mark Step 3 Done
      onStepChange(3, steps[2]);
    }
  };

  // Step 4 Click
  const handleStep4Click = () => {
    if (!canEdit || !onStepChange) return;
    if (currentStep < 3) {
      // Locked: Step 3 must be completed first
      return;
    }
    if (currentStep >= 4) {
      // Undo Step 4
      onStepChange(3, steps[2]);
    } else if (currentStep === 3) {
      // Mark Step 4 Done
      onStepChange(4, steps[3]);
    }
  };

  return (
    <div className={`w-full py-4 px-3 sm:px-6 bg-white select-none transition-all duration-300 ease-in-out ${className}`}>
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
        {/* Main Steps Pipeline Line Wrap */}
        <div className="relative flex-1 min-w-[700px] flex items-start justify-between px-6 pt-1">
          {/* Background Connecting Line */}
          <div className="absolute left-[8%] right-[8%] top-[19px] h-[2px] bg-gray-200 z-0" />

          {/* Progress Filled Track Line */}
          <div
            className="absolute left-[8%] top-[19px] h-[2px] bg-emerald-500 z-0 transition-all duration-500 ease-out"
            style={{
              width:
                currentStep >= 4
                  ? '84%'
                  : currentStep === 3
                  ? '62%'
                  : currentStep === 2
                  ? '36%'
                  : currentStep === 1
                  ? '15%'
                  : '0%',
            }}
          />

          {/* STEP 1: Design & Proof */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit}
              onClick={handleStep1Click}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 shadow-sm ${
                canEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${
                currentStep >= 1
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 0
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 ring-offset-1'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
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
                onClick={handleStep1Click}
                disabled={currentStep > 1}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 border ${
                  currentStep >= 1
                    ? currentStep === 1
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-emerald-50/70 text-emerald-600 border-emerald-100 opacity-60 cursor-default'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer shadow-2xs'
                }`}
              >
                {currentStep >= 1 ? (currentStep === 1 ? 'Undo' : 'DONE') : 'MARK DONE'}
              </button>
            )}
          </div>

          {/* STEP 2: Printing */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit || currentStep < 1}
              onClick={handleStep2Click}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 shadow-sm ${
                canEdit && currentStep >= 1 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-75'
              } ${
                currentStep >= 2
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 1
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 ring-offset-1'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
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
                disabled={currentStep < 1 || currentStep > 2}
                onClick={handleStep2Click}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 border ${
                  currentStep >= 2
                    ? currentStep === 2
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-emerald-50/70 text-emerald-600 border-emerald-100 opacity-60 cursor-default'
                    : currentStep === 1
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer shadow-2xs'
                    : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {currentStep >= 2 ? (currentStep === 2 ? 'Undo' : 'DONE') : 'MARK DONE'}
              </button>
            )}
          </div>

          {/* MIDDLE NODE: PAPER (Gear Icon + Gate to Step 3) */}
          <div className="relative z-10 flex flex-col items-center text-center w-20 pt-0.5">
            <button
              type="button"
              onClick={onPaperNodeClick}
              title={isPaperCompleted ? "Paper Usage Completed (Click to view)" : "Paper Usage Required (Click to record)"}
              className={`w-8 h-8 rounded-full shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer border ${
                isPaperCompleted
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-100'
                  : currentStep >= 2
                  ? 'bg-amber-50 text-amber-600 border-amber-300 ring-2 ring-amber-100 animate-pulse'
                  : 'bg-white text-blue-500 border-gray-200 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              {isPaperCompleted ? <Check size={14} strokeWidth={3} /> : <Settings size={15} />}
            </button>
            <div className="mt-2.5 flex items-center justify-center gap-0.5">
              <span className={`text-[9px] font-black uppercase tracking-wider ${
                isPaperCompleted ? 'text-emerald-600' : currentStep >= 2 ? 'text-amber-600 font-extrabold' : 'text-gray-400'
              }`}>
                PAPER
              </span>
              {isPaperCompleted && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </div>
          </div>

          {/* STEP 3: Binding & Finish (Blocked until Paper is completed!) */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit || currentStep < 2}
              onClick={handleStep3Click}
              title={
                currentStep < 2
                  ? "Complete Printing first"
                  : !isPaperCompleted
                  ? "Record Paper Usage to unlock"
                  : ""
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 shadow-sm ${
                canEdit && currentStep >= 2 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-75'
              } ${
                currentStep >= 3
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 2 && isPaperCompleted
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 ring-offset-1'
                  : currentStep === 2 && !isPaperCompleted
                  ? 'bg-amber-100 text-amber-700 border border-amber-300 ring-2 ring-amber-200/50'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              {currentStep >= 3 ? (
                <Check size={16} strokeWidth={3.5} />
              ) : currentStep === 2 && !isPaperCompleted ? (
                <Lock size={13} />
              ) : (
                '3'
              )}
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
                disabled={currentStep < 2 || currentStep > 3}
                onClick={handleStep3Click}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 border ${
                  currentStep >= 3
                    ? currentStep === 3
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-emerald-50/70 text-emerald-600 border-emerald-100 opacity-60 cursor-default'
                    : currentStep === 2
                    ? isPaperCompleted
                      ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer shadow-2xs'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer'
                    : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {currentStep >= 3
                  ? currentStep === 3
                    ? 'Undo'
                    : 'DONE'
                  : currentStep === 2 && !isPaperCompleted
                  ? 'PAPER REQ'
                  : 'MARK DONE'}
              </button>
            )}
          </div>

          {/* MIDDLE NODE: CHALLAN PROOF (Image icon + Upload trigger) */}
          <div className="relative z-10 flex flex-col items-center text-center w-24 pt-0.5">
            <button
              type="button"
              onClick={onChallanProofClick}
              title={hasChallanProof ? "Challan Proof Uploaded (Click to view)" : "Upload Challan Proof Image"}
              className={`w-8 h-8 rounded-full shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer border ${
                hasChallanProof
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-100'
                  : 'bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {hasChallanProof ? <Check size={14} strokeWidth={3} /> : <ImageIcon size={15} />}
            </button>
            <div className="mt-2.5 flex items-center justify-center gap-0.5">
              <span className={`text-[9px] font-black uppercase tracking-wider ${
                hasChallanProof ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                CHALLAN PROOF
              </span>
              {hasChallanProof && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </div>
          </div>

          {/* STEP 4: QC & Delivery */}
          <div className="relative z-10 flex flex-col items-center text-center w-36">
            <button
              type="button"
              disabled={!canEdit || currentStep < 3}
              onClick={handleStep4Click}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 shadow-sm ${
                canEdit && currentStep >= 3 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-75'
              } ${
                currentStep >= 4
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : currentStep === 3
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 ring-offset-1'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
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
                disabled={currentStep < 3}
                onClick={handleStep4Click}
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 border ${
                  currentStep >= 4
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                    : currentStep === 3
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer shadow-2xs'
                    : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {currentStep >= 4 ? 'Undo' : 'MARK DONE'}
              </button>
            )}
          </div>
        </div>

        {/* TIME LEFT Badge Card (Matching user screenshot) */}
        <div className="shrink-0 pl-2 pr-2">
          <div className="w-24 h-24 rounded-2xl bg-red-50/70 border border-red-100 flex flex-col items-center justify-center text-center shadow-2xs transition-transform hover:scale-102">
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
