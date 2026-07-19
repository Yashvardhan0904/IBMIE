"use client";

import { ShieldCheck, BrainCircuit, FileSearch } from "lucide-react";

export default function AuthHero() {
  return (
    <section className="hidden flex-1 lg:flex lg:items-center">
      <div className="max-w-xl">

        {/* Badge */}
        <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />

          <span className="text-sm font-medium text-white/75">
            Secure AI Health Workspace
          </span>
        </div>

        {/* Heading */}
        <h1
          className="
            mt-8
            text-6xl
            font-semibold
            leading-[0.95]
            tracking-[-0.05em]
            text-white
          "
        >
          Your Health.
          <br />
          Finally Organized.
        </h1>

        {/* Description */}
        <p
          className="
            mt-6
            max-w-lg
            text-lg
            leading-8
            text-white/65
          "
        >
          Store prescriptions, lab reports and medical records
          in one secure workspace. Vitalis automatically
          organizes every document so you can search, understand
          and access your healthcare history whenever you need it.
        </p>

        {/* Features */}
        <div className="mt-12 space-y-6">

          <div className="flex items-start gap-4">
            <div className="liquid-glass rounded-2xl p-3">
              <BrainCircuit className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="font-medium text-white">
                AI-Powered Organization
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/60">
                Automatically extracts and categorizes medical
                information from your documents.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="liquid-glass rounded-2xl p-3">
              <FileSearch className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="font-medium text-white">
                Instant Search
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/60">
                Find medications, diagnoses, lab reports or
                prescriptions in seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="liquid-glass rounded-2xl p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="font-medium text-white">
                Privacy First
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/60">
                Your health records remain encrypted and protected
                with enterprise-grade security.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}