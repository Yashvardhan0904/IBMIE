"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const stepTitles = [
  "About You",
  "Health",
  "Lifestyle",
  "Care",
  "Reports",
];

export default function ProgressBar({
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-emerald-400">
            Step {currentStep} of {totalSteps}
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            {stepTitles[currentStep - 1]}
          </h2>
        </div>

        <span className="text-sm text-white/50">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mt-5 flex justify-between">
        {stepTitles.map((title, index) => {
          const active = index + 1 <= currentStep;

          return (
            <div
              key={title}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`h-3 w-3 rounded-full transition-all ${
                  active
                    ? "bg-emerald-400"
                    : "bg-white/20"
                }`}
              />

              <span
                className={`text-xs ${
                  active
                    ? "text-white"
                    : "text-white/40"
                }`}
              >
                {title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}