"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const insights = [
  {
    title: "Vitamin D is slightly below optimal.",
    desc: "Consider discussing supplementation during your next consultation.",
  },
  {
    title: "Sleep consistency improved this week.",
    desc: "Your average sleep increased by 42 minutes.",
  },
  {
    title: "Blood pressure remains stable.",
    desc: "No concerning trends detected from recent records.",
  },
];

export default function AIInsights() {
  return (
    <section className="rounded-[36px] bg-gradient-to-br from-emerald-500 to-teal-500 p-10 text-white">

      <div className="flex items-center gap-3">

        <div className="rounded-2xl bg-white/20 p-3 backdrop-blur">

          <Sparkles size={22} />

        </div>

        <div>

          <p className="text-sm uppercase tracking-[0.2em] text-white/80">
            Vitalis AI
          </p>

          <h2 className="text-3xl font-semibold">
            Personalized Insights
          </h2>

        </div>

      </div>

      <div className="mt-10 space-y-5">

        {insights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-white/10 p-5 backdrop-blur"
          >
            <h3 className="font-semibold">
              {item.title}
            </h3>

            <p className="mt-2 text-white/80 leading-7">
              {item.desc}
            </p>
          </div>
        ))}

      </div>

      <Link
        href="/chat"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-emerald-700"
      >
        Open AI Assistant
        <ArrowRight size={17} />
      </Link>

    </section>
  );
}