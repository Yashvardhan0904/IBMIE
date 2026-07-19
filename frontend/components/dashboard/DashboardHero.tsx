"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function DashboardHero() {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-10">

      {/* Background Glow */}

      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-10 lg:flex-row lg:items-center">

        <div className="max-w-2xl">

          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-600">
            Welcome Back
          </p>

          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-slate-900 font-display">
            Your health,
            <br />
            beautifully organized.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Track reports, understand medical records,
            monitor medications and ask Vitalis anything
            about your health in one secure workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-emerald-600"
            >
              <Sparkles size={18} />
              Ask Vitalis
            </Link>

            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Upload Report
              <ArrowRight size={17} />
            </Link>

          </div>

        </div>

        {/* Health Score */}

        <div className="rounded-[30px] bg-white p-8 shadow-xl shadow-emerald-100/40">

          <p className="text-sm text-slate-500">
            Overall Health
          </p>

          <div className="mt-3 flex items-end gap-2">

            <span className="text-7xl font-bold text-slate-900">
              87
            </span>

            <span className="mb-3 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              +4%
            </span>

          </div>

          <p className="mt-4 text-slate-500">
            Better than last week.
          </p>

        </div>

      </div>

    </section>
  );
}