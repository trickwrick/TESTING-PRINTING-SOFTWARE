import React, { useMemo } from 'react';
import { Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * Default workflow steps tailored for printing & signage workflow
 */
export const DEFAULT_WORKFLOW_STEPS = [
  { id: 1, title: 'Design & Proof', desc: 'Artwork & client approval', role: 'Designer' },
  { id: 2, title: 'Printing', desc: 'Plate making & print production', role: 'Machine Operator' },
  { id: 3, title: 'Binding & Finish', desc: 'Cutting, folding & binding', role: 'Binder' },
  { id: 4, title: 'QC & Delivery', desc: 'Quality check & dispatch', role: 'Dispatcher' },
];

/**
 * Interactive, Modern Multi-step Workflow Progress Stepper Component
 *
 * @param {Array} steps - List of steps [{ id, title, desc, role }]
 * @param {number} currentStep - Number of completed steps (0 = none, 1..N)
 * @param {Function} onStepChange - Callback: (newStepNo, stepData) => void
 * @param {Object} completedByMap - Record of step number to completed by details { 1: "Rahul", 2: { name: "Admin", at: "12:30 PM" } }
 * @param {boolean} canEdit - Whether user is permitted to toggle/advance steps
 * @param {Function} beforeStepChange - Optional async/sync validation hook: (targetStep, currentStep) => boolean | Promise<boolean>
 * @param {React.ReactNode} customMiddleNode - Optional middle element (e.g., file upload badge, timeline)
 * @param {boolean} showOverallStatus - Whether to display top summary status badge (Pending / In Progress / Completed)
 * @param {string} className - Optional wrapper CSS class
 */
export default function WorkflowProgressLine({
  steps = DEFAULT_WORKFLOW_STEPS,
  currentStep = 0,
  onStepChange,
  completedByMap = {},
  canEdit = true,
  beforeStepChange = null,
  customMiddleNode = null,
  showOverallStatus = false,
  className = '',
}) {
  const totalSteps = steps.length;

  // Auto calculate overall pipeline status
  const overallStatus = useMemo(() => {
    if (currentStep <= 0) return { key: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (currentStep >= totalSteps) return { key: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { key: 'in-progress', label: `In Progress (${currentStep}/${totalSteps})`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }, [currentStep, totalSteps]);

  // Percentage for the active green fill line
  const progressPercent = useMemo(() => {
    if (totalSteps <= 1) return currentStep > 0 ? 100 : 0;
    const completedRatio = Math.min(Math.max(currentStep - 1, 0), totalSteps - 1) / (totalSteps - 1);
    return currentStep === 0 ? 0 : Math.round(completedRatio * 100);
  }, [currentStep, totalSteps]);

  const handleStepClick = async (stepNo) => {
    if (!canEdit || !onStepChange) return;

    // Toggle behavior: clicking active/completed step undoes, clicking pending advances
    const targetStep = currentStep === stepNo ? stepNo - 1 : stepNo;

    // Optional validation hook check
    if (typeof beforeStepChange === 'function') {
      try {
        const allowed = await beforeStepChange(targetStep, currentStep, steps[stepNo - 1]);
        if (!allowed) return;
      } catch (err) {
        console.warn('Step validation prevented progression:', err);
        return;
      }
    }

    onStepChange(targetStep, steps[targetStep - 1] || null);
  };

  return (
    <div className={`w-full py-3 px-2 ${className}`}>
      {/* Optional Top Status Bar */}
      {showOverallStatus && (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Workflow Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] border ${overallStatus.color}`}>
              {overallStatus.label}
            </span>
          </div>
          <span className="text-gray-400 font-semibold text-[11px]">
            {currentStep} of {totalSteps} Steps Complete
          </span>
        </div>
      )}

      {/* Stepper Pipeline Visual */}
      <div className="overflow-x-auto pb-2">
        <div className="relative flex items-start justify-between min-w-[560px] px-4 pt-1">
          {/* Base Background Connecting Line */}
          <div className="absolute left-[10%] right-[10%] top-5.5 h-[3px] bg-gray-200 z-0 rounded-full" />

          {/* Active Completed Filled Line (Green) */}
          <div
            className="absolute left-[10%] top-5.5 h-[3px] bg-emerald-500 z-0 transition-all duration-300 rounded-full"
            style={{
              width: totalSteps > 1
                ? `calc(${Math.min(currentStep, totalSteps) / (totalSteps - 1) * 80}% * 1)`
                : currentStep > 0 ? '80%' : '0%',
              maxWidth: '80%',
            }}
          />

          {/* Optional custom middle node (e.g. Upload icon or Inspector Tag) */}
          {customMiddleNode && (
            <div className="absolute left-1/2 top-5 -translate-x-1/2 -translate-y-1/2 z-20">
              {customMiddleNode}
            </div>
          )}

          {/* Steps Loop */}
          {steps.map((step, index) => {
            const stepNo = index + 1;
            const isDone = currentStep >= stepNo;
            const isActive = currentStep + 1 === stepNo;
            const completedByData = completedByMap[stepNo];
            const completedByName = typeof completedByData === 'object' ? completedByData?.name : completedByData;

            return (
              <div
                key={step.id || step.title || index}
                className="relative z-10 flex flex-col items-center text-center flex-1 group"
              >
                {/* Step Indicator Circle */}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleStepClick(stepNo)}
                  title={`Step ${stepNo}: ${step.title} (${isDone ? 'Completed' : isActive ? 'In Progress' : 'Pending'})`}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-xs transition-all duration-200 outline-none select-none ${
                    canEdit ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                  } ${
                    isDone
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 hover:ring-emerald-200 shadow-emerald-200'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 hover:ring-blue-200 animate-pulse-subtle shadow-blue-200'
                      : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {isDone ? (
                    <Check size={16} strokeWidth={3} className="animate-in zoom-in-50 duration-150" />
                  ) : (
                    <span>{stepNo}</span>
                  )}
                </button>

                {/* Step Title */}
                <p
                  onClick={() => canEdit && handleStepClick(stepNo)}
                  className={`mt-2.5 text-xs font-black tracking-tight leading-snug max-w-[130px] transition-colors ${
                    isDone ? 'text-emerald-900' : isActive ? 'text-blue-700' : 'text-gray-700'
                  } ${canEdit ? 'cursor-pointer hover:underline' : ''}`}
                >
                  {step.title}
                </p>

                {/* Step Subtitle / Description */}
                {step.desc && (
                  <p className="mt-0.5 text-[10px] text-gray-400 font-medium leading-tight max-w-[120px] line-clamp-2">
                    {step.desc}
                  </p>
                )}

                {/* Role indicator if present */}
                {step.role && !completedByName && (
                  <span className="mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    {step.role}
                  </span>
                )}

                {/* Completed By Badge */}
                {isDone && completedByName && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <Check size={10} strokeWidth={3} />
                    {completedByName}
                  </span>
                )}

                {/* In-Progress indicator badge */}
                {isActive && !isDone && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200">
                    <Clock size={10} />
                    Current
                  </span>
                )}

                {/* Action Button: Mark Done / Undo */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleStepClick(stepNo)}
                    className={`mt-2.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-150 border shadow-2xs active:scale-95 ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                        : isActive
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {isDone ? 'Undo' : isActive ? 'Complete' : 'Mark Done'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
