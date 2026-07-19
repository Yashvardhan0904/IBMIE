"use client";

import { Dispatch, SetStateAction } from "react";
import { MoonStar, Dumbbell, Droplets } from "lucide-react";

import type { OnboardingData } from "@/app/onboarding/page";

interface LifestyleStepProps {
  data: OnboardingData;
  setData: Dispatch<SetStateAction<OnboardingData>>;
}

const exerciseOptions = [
  "Never",
  "1–2 times/week",
  "3–5 times/week",
  "Daily",
];

export default function LifestyleStep({
  data,
  setData,
}: LifestyleStepProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

      <h1 className="text-3xl font-semibold">
        Lifestyle
      </h1>

      <p className="mt-2 text-white/60">
        Small daily habits create long-term health.
      </p>

      {/* Sleep */}

      <div className="mt-10">

        <div className="mb-3 flex items-center gap-2">
          <MoonStar size={18} />
          <span className="font-medium">
            Sleep Hours
          </span>
        </div>

        <input
          type="range"
          min={3}
          max={12}
          value={data.sleepHours}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              sleepHours: Number(e.target.value),
            }))
          }
          className="w-full accent-emerald-500"
        />

        <p className="mt-2 text-sm text-white/60">
          {data.sleepHours} hours / day
        </p>

      </div>

      {/* Exercise */}

      <div className="mt-10">

        <div className="mb-4 flex items-center gap-2">
          <Dumbbell size={18} />
          <span className="font-medium">
            Exercise Frequency
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {exerciseOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  exerciseFrequency: item,
                }))
              }
              className={`rounded-2xl border p-4 transition ${
                data.exerciseFrequency === item
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

      </div>

      {/* Water */}

      <div className="mt-10">

        <div className="mb-3 flex items-center gap-2">
          <Droplets size={18} />
          <span className="font-medium">
            Water Intake
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={6}
          step={0.5}
          value={data.waterIntake}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              waterIntake: Number(e.target.value),
            }))
          }
          className="w-full accent-cyan-500"
        />

        <p className="mt-2 text-sm text-white/60">
          {data.waterIntake} L / day
        </p>

      </div>

    </div>
  );
}