"use client";

import Link from "next/link";
import {
  Clock3,
  Pill,
  Droplets,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const medicines = [
  {
    name: "Vitamin D",
    time: "8:00 AM",
    done: true,
  },
  {
    name: "Metformin",
    time: "2:00 PM",
    done: false,
  },
  {
    name: "Omega 3",
    time: "9:00 PM",
    done: false,
  },
];

export default function DailyCare() {
  return (
    <section className="rounded-[34px] bg-white p-8 shadow-sm ring-1 ring-slate-100">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-600">
            Today
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Daily Care
          </h2>
        </div>

        <Clock3 className="text-emerald-500" />
      </div>

      <div className="mt-8 space-y-4">

        {medicines.map((medicine) => (
          <div
            key={medicine.name}
            className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
          >
            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-emerald-50 p-3">
                <Pill
                  className="text-emerald-600"
                  size={18}
                />
              </div>

              <div>
                <h3 className="font-medium text-slate-900">
                  {medicine.name}
                </h3>

                <p className="text-sm text-slate-500">
                  {medicine.time}
                </p>
              </div>

            </div>

            {medicine.done ? (
              <CheckCircle2 className="text-emerald-500" />
            ) : (
              <div className="h-3 w-3 rounded-full bg-orange-400" />
            )}
          </div>
        ))}

      </div>

      <div className="mt-8 rounded-3xl bg-cyan-50 p-5">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-cyan-100 p-3">
            <Droplets className="text-cyan-700" />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Water Intake
            </p>

            <h3 className="text-2xl font-semibold text-slate-900">
              5 / 8 Glasses
            </h3>
          </div>

        </div>

      </div>

      <Link
        href="/reminders"
        className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-emerald-600"
      >
        View Full Schedule
        <ArrowRight size={16} />
      </Link>

    </section>
  );
}