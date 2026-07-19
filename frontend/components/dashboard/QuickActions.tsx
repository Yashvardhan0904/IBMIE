"use client";

import Link from "next/link";
import {
  UploadCloud,
  Sparkles,
  ClipboardPlus,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

const actions = [
  {
    title: "Upload Report",
    desc: "Analyze a new medical document",
    href: "/upload",
    icon: UploadCloud,
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Ask Vitalis",
    desc: "Talk with your AI assistant",
    href: "/chat",
    icon: Sparkles,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Health Log",
    desc: "Track today's habits",
    href: "/track",
    icon: ClipboardPlus,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    title: "Appointments",
    desc: "Manage upcoming visits",
    href: "/appointments",
    icon: CalendarDays,
    color: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export default function QuickActions() {
  return (
    <section className="rounded-[34px] bg-white p-8 shadow-sm ring-1 ring-slate-100">

      <div>

        <p className="text-sm uppercase tracking-[0.25em] text-emerald-600">
          Shortcuts
        </p>

        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Quick Actions
        </h2>

      </div>

      <div className="mt-8 grid gap-4">

        {actions.map((action) => (

          <Link
            key={action.title}
            href={action.href}
            className="group flex items-center justify-between rounded-2xl border border-slate-100 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
          >

            <div className="flex items-center gap-4">

              <div
                className={`rounded-2xl p-3 ${action.color}`}
              >
                <action.icon
                  size={20}
                  className={action.iconColor}
                />
              </div>

              <div>

                <h3 className="font-semibold text-slate-900">
                  {action.title}
                </h3>

                <p className="text-sm text-slate-500">
                  {action.desc}
                </p>

              </div>

            </div>

            <ArrowRight className="text-slate-400 transition-transform group-hover:translate-x-1" />

          </Link>

        ))}

      </div>

    </section>
  );
}