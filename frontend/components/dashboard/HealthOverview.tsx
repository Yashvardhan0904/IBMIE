"use client";

import {
  Heart,
  Moon,
  Activity,
  Droplets,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
const metrics = [
  {
    icon: Heart,
    title: "Calories Burned",
    value: "720 kcal",
    status: "Normal",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    icon: Moon,
    title: "Sleep",
    value: "7.8 hrs",
    status: "Excellent",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Activity,
    title: "Activity",
    value: "8,254",
    status: "Steps Today",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Droplets,
    title: "Water",
    value: "5 / 8",
    status: "Glasses",
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
];

export default function HealthOverview() {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="rounded-[30px] bg-white p-7 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div
            className={`h-14 w-14 rounded-2xl ${metric.bg} flex items-center justify-center`}
          >
            <metric.icon className={metric.color} size={24} />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            {metric.title}
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            {metric.value}
          </h2>

          <div className="mt-4 flex items-center gap-2">

  <TrendingUp
    size={15}
    className="text-emerald-500"
  />

  <span className="text-sm font-medium text-emerald-600">
    {metric.status}
  </span>

</div>

<div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">

  <div className="flex items-center gap-2">

    <Image
      src="/brand/google-fit.svg"
      alt="Google Fit"
      width={18}
      height={18}
      className="h-[18px] w-[18px]"
    />

    <span className="text-xs font-medium text-slate-500">
      Data from Google Fit
    </span>

  </div>

  <div className="flex items-center gap-1.5">

    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

    <span className="text-xs text-slate-400">
      Live
    </span>

  </div>

</div>
        </div>
      ))}
    </section>
  );
}