"use client";

import { Dispatch, SetStateAction } from "react";
import {
  Bell,
  Pill,
  Target,
  ShieldAlert,
  Plus,
  Trash2,
} from "lucide-react";

import type { OnboardingData } from "@/app/onboarding/page";

interface CareStepProps {
  data: OnboardingData;
  setData: Dispatch<SetStateAction<OnboardingData>>;
}

const goals = [
  "Lose Weight",
  "Gain Weight",
  "Improve Fitness",
  "Better Sleep",
  "Reduce Stress",
  "Manage Diabetes",
];

const reminderMethods = [
  "App Notification",
  "Email",
  "SMS",
];

const reminderTimes = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

export default function CareStep({
  data,
  setData,
}: CareStepProps) {
  const addMedicine = () => {
    setData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: "",
          frequency: "",
          reminderTimes: [],
        },
      ],
    }));
  };

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

      <h1 className="text-3xl font-semibold">
        Care Preferences
      </h1>

      <p className="mt-2 text-white/60">
        Tell Vitalis how you'd like to stay on
        track.
      </p>

      {/* Medication */}

      <div className="mt-10">

        <div className="mb-5 flex items-center gap-2">
          <Pill size={18} />
          <span className="font-medium">
            Current Medications
          </span>
        </div>

        {data.medications.map((medicine, index) => (
          <div
            key={index}
            className="mb-5 rounded-2xl border border-white/10 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">

              <input
                placeholder="Medicine Name"
                value={medicine.name}
                onChange={(e) => {
                  const meds = [...data.medications];
                  meds[index].name = e.target.value;
                  setData({
                    ...data,
                    medications: meds,
                  });
                }}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              />

              <input
                placeholder="Frequency"
                value={medicine.frequency}
                onChange={(e) => {
                  const meds = [...data.medications];
                  meds[index].frequency =
                    e.target.value;
                  setData({
                    ...data,
                    medications: meds,
                  });
                }}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              />

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              {reminderTimes.map((time) => {

                const active =
                  medicine.reminderTimes.includes(
                    time
                  );

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      const meds = [
                        ...data.medications,
                      ];

                      if (active) {
                        meds[index].reminderTimes =
                          meds[
                            index
                          ].reminderTimes.filter(
                            (t) => t !== time
                          );
                      } else {
                        meds[index].reminderTimes.push(
                          time
                        );
                      }

                      setData({
                        ...data,
                        medications: meds,
                      });
                    }}
                    className={`rounded-full border px-4 py-2 ${
                      active
                        ? "border-emerald-400 bg-emerald-500/20"
                        : "border-white/10"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}

            </div>

            <button
              className="mt-5 flex items-center gap-2 text-red-400"
              onClick={() => {
                setData({
                  ...data,
                  medications:
                    data.medications.filter(
                      (_, i) => i !== index
                    ),
                });
              }}
            >
              <Trash2 size={16} />
              Remove
            </button>

          </div>
        ))}

        <button
          onClick={addMedicine}
          className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 font-medium text-black"
        >
          <Plus size={18} />
          Add Medicine
        </button>

      </div>

      {/* Allergies */}

      <div className="mt-10">

        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert size={18} />
          Allergies
        </div>

        <input
          placeholder="Dust, Penicillin, Peanuts..."
          value={data.allergies.join(", ")}
          onChange={(e) =>
            setData({
              ...data,
              allergies: e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
        />

      </div>

      {/* Goal */}

      <div className="mt-10">

        <div className="mb-4 flex items-center gap-2">
          <Target size={18} />
          Health Goal
        </div>

        <div className="grid grid-cols-2 gap-4">

          {goals.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() =>
                setData({
                  ...data,
                  healthGoal: goal,
                })
              }
              className={`rounded-2xl border p-4 ${
                data.healthGoal === goal
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-white/10"
              }`}
            >
              {goal}
            </button>
          ))}

        </div>

      </div>

      {/* Reminder */}

      <div className="mt-10">

        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} />
          Reminder Method
        </div>

        <div className="flex flex-wrap gap-3">

          {reminderMethods.map((method) => {

            const active =
              data.reminderMethods.includes(method);

            return (
              <button
                key={method}
                type="button"
                onClick={() => {
                  if (active) {
                    setData({
                      ...data,
                      reminderMethods:
                        data.reminderMethods.filter(
                          (m) => m !== method
                        ),
                    });
                  } else {
                    setData({
                      ...data,
                      reminderMethods: [
                        ...data.reminderMethods,
                        method,
                      ],
                    });
                  }
                }}
                className={`rounded-full border px-4 py-2 ${
                  active
                    ? "border-emerald-400 bg-emerald-500/20"
                    : "border-white/10"
                }`}
              >
                {method}
              </button>
            );
          })}

        </div>

      </div>

    </div>
  );
}