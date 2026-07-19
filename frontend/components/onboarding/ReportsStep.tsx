"use client";

import { Dispatch, SetStateAction, useRef } from "react";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import type { OnboardingData } from "@/app/onboarding/page";

interface ReportsStepProps {
  data: OnboardingData;
  setData: Dispatch<SetStateAction<OnboardingData>>;
}

const reportTypes = [
  "Medical Report",
  "Prescription",
  "Lab Report",
  "Scan / Imaging",
  "Other",
] as const;

type ReportType = (typeof reportTypes)[number];

export default function ReportsStep({
  data,
  setData,
}: ReportsStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const uploaded = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      type: "Medical Report" as ReportType,
    }));

    setData((prev) => ({
      ...prev,
      reports: [...prev.reports, ...uploaded],
    }));
  };

  const updateType = (
    id: string,
    type: ReportType
  ) => {
    setData((prev) => ({
      ...prev,
      reports: prev.reports.map((report) =>
        report.id === id
          ? { ...report, type }
          : report
      ),
    }));
  };

  const removeReport = (id: string) => {
    setData((prev) => ({
      ...prev,
      reports: prev.reports.filter(
        (report) => report.id !== id
      ),
    }));
  };

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

      <h1 className="text-3xl font-semibold">
        Upload Medical Reports
      </h1>

      <p className="mt-2 text-white/60">
        Upload previous prescriptions, blood
        tests or medical reports. This is
        completely optional and can be done
        later.
      </p>

      {/* Upload */}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-10 flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-10 transition hover:border-emerald-400 hover:bg-emerald-500/10"
      >
        <UploadCloud
          size={52}
          className="text-emerald-400"
        />

        <p className="mt-4 text-lg font-medium">
          Upload Reports
        </p>

        <p className="mt-2 text-sm text-white/50">
          PDF, JPG or PNG
        </p>
      </button>

      <input
        ref={inputRef}
        hidden
        multiple
        accept=".pdf,image/*"
        type="file"
        onChange={(e) =>
          handleFiles(e.target.files)
        }
      />

      {/* Uploaded Files */}

      {data.reports.length > 0 && (
        <div className="mt-10 space-y-4">

          {data.reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-start justify-between gap-5">

                <div className="flex items-center gap-4">

                  <div className="rounded-xl bg-emerald-500/10 p-3">
                    <FileText className="text-emerald-400" />
                  </div>

                  <div>

                    <p className="font-medium">
                      {report.file.name}
                    </p>

                    <p className="text-sm text-white/50">
                      {(
                        report.file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeReport(report.id)
                  }
                  className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                >
                  <Trash2 size={18} />
                </button>

              </div>

              <select
                value={report.type}
                onChange={(e) =>
                  updateType(
                    report.id,
                    e.target.value as ReportType
                  )
                }
                className="mt-5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
              >
                {reportTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>

            </div>
          ))}

        </div>
      )}

      {/* Privacy */}

      <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">

        <div className="flex items-start gap-4">

          <ShieldCheck className="mt-1 text-emerald-400" />

          <div>

            <h3 className="font-medium">
              Your data stays private
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/60">
              All uploaded reports are securely
              stored and used only to generate
              personalized health insights,
              reminders and AI-powered analysis.
              You can remove them at any time.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}