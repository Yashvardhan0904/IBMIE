"use client";

import { Dispatch, SetStateAction } from "react";

import { Activity } from "lucide-react";

import type { OnboardingData } from "@/app/onboarding/page";

interface HealthStepProps {
  data: OnboardingData;
  setData: Dispatch<SetStateAction<OnboardingData>>;
}

const conditions = [
  "None",
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Thyroid",
  "Other",
];

export default function HealthStep({
  data,
  setData,
}: HealthStepProps) {

  const bmi =
    data.height && data.weight
      ? (
          Number(data.weight) /
          Math.pow(Number(data.height) / 100, 2)
        ).toFixed(1)
      : "--";

  const toggleCondition = (condition: string) => {
    if (condition === "None") {
      setData((prev) => ({
        ...prev,
        conditions: ["None"],
      }));
      return;
    }

    const current = data.conditions.filter(
      (c) => c !== "None"
    );

    if (current.includes(condition)) {
      setData((prev) => ({
        ...prev,
        conditions: current.filter(
          (c) => c !== condition
        ),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        conditions: [...current, condition],
      }));
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

      <h1 className="text-3xl font-semibold">
        Health Snapshot
      </h1>

      <p className="mt-2 text-white/60">
        Your basic health information helps us
        generate more accurate insights.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">

        <div>
          <label className="mb-2 block">
            Height (cm)
          </label>

          <input
            type="number"
            value={data.height}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                height: Number(e.target.value),
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block">
            Weight (kg)
          </label>

          <input
            type="number"
            value={data.weight}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                weight: Number(e.target.value),
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2">
            <Activity size={16} />
            BMI
          </label>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-lg font-semibold">
            {bmi}
          </div>
        </div>

      </div>

      <div className="mt-8">
        <label className="mb-4 block">
          Existing Medical Conditions
        </label>

        <div className="flex flex-wrap gap-3">
          {conditions.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() => toggleCondition(condition)}
              className={`rounded-full border px-4 py-2 transition ${
                data.conditions.includes(condition)
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}