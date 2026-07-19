"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepNavigationProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
}

export default function StepNavigation({
  step,
  totalSteps,
  onBack,
  onNext,
}: StepNavigationProps) {
  const isLast = step === totalSteps;

  return (
    <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-medium text-black transition hover:scale-[1.02]"
      >
        {isLast ? "Finish" : "Continue"}

        <ArrowRight size={18} />
      </button>
    </div>
  );
}