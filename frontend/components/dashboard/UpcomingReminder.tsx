"use client";

import { Clock3, Pill } from "lucide-react";

export default function UpcomingReminder() {
  return (
    <section className="rounded-[34px] bg-gradient-to-br from-emerald-500 to-teal-500 p-8 text-white">

      <p className="text-sm uppercase tracking-[0.3em] text-white/70">
        Next Reminder
      </p>

      <div className="mt-8 flex items-center gap-4">

        <div className="rounded-2xl bg-white/20 p-4">

          <Pill size={26} />

        </div>

        <div>

          <h2 className="text-2xl font-semibold">
            Vitamin D
          </h2>

          <p className="mt-1 text-white/70">
            2:00 PM Today
          </p>

        </div>

      </div>

      <div className="mt-10 flex items-center gap-2 text-sm">

        <Clock3 size={16} />

        <span>
          Starts in 1 hour 12 mins
        </span>

      </div>

    </section>
  );
}