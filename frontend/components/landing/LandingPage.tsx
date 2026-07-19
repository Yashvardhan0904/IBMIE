"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  FileText,
  HeartPulse,
  LockKeyhole,
  Menu,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
];

const features = [
  {
    icon: UploadCloud,
    title: "Bring everything together",
    text: "Upload lab reports, prescriptions, and health documents into one calm, searchable space.",
  },
  {
    icon: MessageCircleHeart,
    title: "Ask in plain language",
    text: "Get general explanations of your reports and practical next steps without the medical jargon.",
  },
  {
    icon: HeartPulse,
    title: "Build healthier patterns",
    text: "Track sleep, water, movement, meals, habits, and reminders in a routine that feels human.",
  },
];

const steps = [
  ["01", "Create your health context", "Tell Vitalis about your routine, goals, medications, and the things you want to improve."],
  ["02", "Add your reports", "Upload a PDF or prescription so your health history can live alongside your daily habits."],
  ["03", "Understand what comes next", "Review simple summaries, ask questions, and use gentle reminders to keep moving forward."],
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6FBF8] text-[#1F2937]">
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Vitalis home">
            <Image src="/brand/logoc.png" alt="Vitalis" width={38} height={38} priority className="rounded-xl" />
            <span className="text-xl font-semibold text-white">Vitalis</span>
          </Link>

          <div className="hidden items-center gap-8 rounded-full border border-white/15 bg-black/20 px-6 py-3 text-sm text-white/80 backdrop-blur-md md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth" className="rounded-full px-4 py-2.5 text-sm font-medium text-white/85 transition hover:text-white">
              Sign in
            </Link>
            <Link href="/profile" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0F766E] transition hover:scale-[1.02]">
              Get started <ArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white backdrop-blur-md md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="mx-5 rounded-3xl border border-white/15 bg-[#0B2927]/95 p-5 text-white shadow-xl backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenu} className="rounded-2xl px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <Link href="/auth" onClick={closeMenu} className="block rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-[#0F766E]">
                Sign in or create account
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative flex min-h-[720px] items-end overflow-hidden bg-[#082522] px-5 pb-20 pt-36 sm:px-8 lg:min-h-[780px] lg:px-10 lg:pb-28">
          <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-55" aria-hidden="true">
            <source src="/videos/anatomy1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#061917]/75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(20,184,166,0.25),transparent_38%)]" />

          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-emerald-100 backdrop-blur-md">
                <Sparkles size={14} /> Personal health intelligence
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] text-white sm:text-7xl lg:text-8xl">
                Your health, understood.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Vitalis brings your reports, routines, and questions into one thoughtful health workspace, so you can see the bigger picture and take the next step with more confidence.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/profile" className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0F766E] transition hover:scale-[1.02]">
                  Start your health journey <ArrowRight size={16} />
                </Link>
                <a href="#how-it-works" className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10">
                  See how it works
                </a>
              </div>
            </div>
            <div className="mt-20 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-white/55">
              <span className="flex items-center gap-2"><ShieldCheck size={15} /> Built around your context</span>
              <span className="flex items-center gap-2"><LockKeyhole size={15} /> Designed with privacy in mind</span>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-8 bg-[#F6FBF8] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Features</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-5xl">A clearer way to care for yourself.</h2>
              <p className="mt-5 text-base leading-7 text-[#64748B]">The pieces of Vitalis are designed to work together, turning scattered information into a useful daily picture.</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-3xl border border-[#D8E5DD] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F3ED] text-[#0F766E]"><Icon size={22} /></div>
                    <h3 className="mt-7 text-xl font-semibold text-[#1F2937]">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#64748B]">{feature.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-8 bg-[#E7F3ED] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">How it works</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-5xl">From information to confidence.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-[#64748B]">Start where you are. Vitalis helps you organize the details that matter, then keeps them close as your health story changes.</p>
            </div>
            <div className="divide-y divide-[#C9DED2]">
              {steps.map(([number, title, text]) => (
                <div key={number} className="grid gap-4 py-7 sm:grid-cols-[72px_1fr] sm:gap-7 first:pt-0 last:pb-0">
                  <span className="text-sm font-semibold text-[#0F766E]">{number}</span>
                  <div><h3 className="text-xl font-semibold text-[#1F2937]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B]">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-8 bg-white px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">Privacy</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#1F2937] sm:text-5xl">Your health story belongs to you.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#64748B]">Vitalis is designed around a simple promise: make your information easier for you to understand without making it feel less personal or less private.</p>
              <div className="mt-8 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F3ED] text-[#0F766E]"><ShieldCheck size={20} /></div>
                <div><h3 className="font-semibold text-[#1F2937]">Clear, human explanations</h3><p className="mt-1 text-sm leading-6 text-[#64748B]">Vitalis provides general information and reminders. It does not replace your doctor or make a diagnosis.</p></div>
              </div>
              <div className="mt-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F3ED] text-[#0F766E]"><LockKeyhole size={20} /></div>
                <div><h3 className="font-semibold text-[#1F2937]">A private-by-design workspace</h3><p className="mt-1 text-sm leading-6 text-[#64748B]">Your profile and uploads are used to shape your Vitalis experience, with access controls and integrations still being finalized.</p></div>
              </div>
            </div>
            <div className="rounded-3xl border border-[#D8E5DD] bg-[#F6FBF8] p-8 sm:p-10">
              <FileText className="text-[#0F766E]" size={28} />
              <p className="mt-7 text-2xl font-semibold leading-snug text-[#1F2937]">“The goal is not more health data. It is a better relationship with the data you already have.”</p>
              <p className="mt-6 text-sm text-[#64748B]">Vitalis product principle</p>
            </div>
          </div>
        </section>

        <section className="bg-[#0B2927] px-5 py-16 text-white sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Temporary project notice</p>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Vitalis is currently an IBM Internship project.</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">The copy, workflows, and privacy language on this landing page are temporary and will be reviewed and edited before production release.</p>
            </div>
            <Link href="/profile" className="flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0F766E] transition hover:scale-[1.02]">Explore Vitalis <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#071F1D] px-5 py-8 text-white/50 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-white/80">Vitalis</span>
          <span>Temporary IBM Internship project - content subject to change before production.</span>
        </div>
      </footer>
    </div>
  );
}
