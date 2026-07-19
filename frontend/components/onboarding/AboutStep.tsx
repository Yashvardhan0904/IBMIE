"use client";

import { Dispatch, SetStateAction, useEffect } from "react";

import { Calendar, User, VenusAndMars } from "lucide-react";

import type { OnboardingData } from "@/app/onboarding/page";

interface AboutStepProps {
  data: OnboardingData;
  setData: Dispatch<SetStateAction<OnboardingData>>;
}

const sexes = [
  "Male",
  "Female",
  "Other",
];

export default function AboutStep({
  data,
  setData,
}: AboutStepProps) {

  useEffect(() => {
    if (!data.dateOfBirth) return;

    const dob = new Date(data.dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 &&
        today.getDate() < dob.getDate())
    ) {
      age--;
    }

    setData((prev) => ({
      ...prev,
      age,
    }));
  }, [data.dateOfBirth, setData]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

      <h1 className="text-3xl font-semibold">
        Let's get to know you
      </h1>

      <p className="mt-2 text-white/60">
        This helps Vitalis personalize your
        health insights.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <User size={16} />
            Full Name
          </label>

          <input
            value={data.fullName}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                fullName: e.target.value,
              }))
            }
            placeholder="John Doe"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <Calendar size={16} />
            Date of Birth
          </label>

          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                dateOfBirth: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-500"
          />
        </div>

      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">

        <div>
          <label className="mb-2 block text-sm text-white/70">
            Age
          </label>

          <input
            value={data.age}
            readOnly
            placeholder="Calculated automatically"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/60"
          />
        </div>

        <div>
          <label className="mb-3 flex items-center gap-2 text-sm text-white/70">
            <VenusAndMars size={16} />
            Biological Sex
          </label>

          <div className="grid grid-cols-3 gap-3">
            {sexes.map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    sex,
                  }))
                }
                className={`rounded-2xl border px-4 py-3 transition ${
                  data.sex === sex
                    ? "border-emerald-400 bg-emerald-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}