"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, User, CalendarDays, Stethoscope, Clock,
  FlaskConical, Pill, MessageCircleHeart, AlertOctagon, Sparkles,
} from "lucide-react";
import { T } from "@/lib/tokens";
import { StatusPill, VitalisLine, Card } from "./UI";
import { MedicalDocument } from "@/lib/types";
import ExplainChat from "./ExplainChat";

export default function ReportDetail({ doc }: { doc: MedicalDocument }) {
  const [tab, setTab] = useState<"simple" | "data">("simple");

  const grouped = useMemo(() => {
    const g: Record<string, typeof doc.results> = {};
    (doc.results || []).forEach((r) => {
      g[r.category] = g[r.category] || [];
      (g[r.category] as any[]).push(r);
    });
    return g;
  }, [doc]);

  return (
    <div>
      <Link href="/reports" className="flex items-center gap-1.5 text-[12.5px] font-medium mb-4 w-fit" style={{ color: T.muted }}>
        <ArrowLeft size={14} /> Back to my reports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>{doc.title}</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.muted, fontFamily: "var(--font-body)" }}>
            {doc.category} · captured {doc.date} · {doc.ocrUsed ? "OCR pipeline" : "digital text layer"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3.5 py-2" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <ShieldCheck size={15} color={T.primary} />
          <span className="text-[12.5px] font-medium" style={{ color: T.inkSoft, fontFamily: "var(--font-body)" }}>
            {Math.round(doc.confidence * 100)}% extraction confidence
          </span>
        </div>
      </div>

      {doc.urgent && (
        <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: T.criticalTint, border: `1px solid ${T.critical}` }}>
          <AlertOctagon size={20} color={T.critical} className="mt-0.5 shrink-0" />
          <div>
            <div className="text-[13.5px] font-semibold" style={{ color: T.critical, fontFamily: "var(--font-body)" }}>
              Flagged for prompt attention — {doc.urgent.test_name}
            </div>
            <p className="text-[12.5px] mt-0.5" style={{ color: T.inkSoft, fontFamily: "var(--font-body)" }}>{doc.urgent.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: User, label: "Patient", value: doc.patient.patientId },
          { icon: CalendarDays, label: "Age / Gender", value: `${doc.patient.age} · ${doc.patient.gender}` },
          { icon: Stethoscope, label: "Referring physician", value: doc.patient.referringDoctor },
          { icon: Clock, label: "Report date", value: doc.date },
        ].map((f) => (
          <Card key={f.label} className="p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5" style={{ color: T.muted }}>
              <f.icon size={12.5} /> {f.label.toUpperCase()}
            </div>
            <div className="text-[13.5px] font-medium" style={{ color: T.ink, fontFamily: "var(--font-body)" }}>{f.value}</div>
          </Card>
        ))}
      </div>

      {doc.type === "lab_report" && (
        <>
          <div className="flex items-center gap-2 mb-5 rounded-lg p-1 w-fit" style={{ background: T.canvasAlt }}>
            {[
              { key: "simple", label: "Plain-language explanation", icon: MessageCircleHeart },
              { key: "data", label: "Structured data", icon: FlaskConical },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12.5px] font-semibold"
                style={{
                  background: tab === t.key ? T.card : "transparent",
                  color: tab === t.key ? T.primary : T.muted,
                  fontFamily: "var(--font-body)",
                }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {tab === "simple" ? (
            <div className="flex flex-col gap-4">
              {doc.overallSummary && (
                <Card className="p-5" style={{ background: T.primaryTint, border: "none" }}>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-semibold mb-2" style={{ color: T.primary }}>
                    <Sparkles size={13} /> IN SIMPLE TERMS
                  </div>
                  <p className="text-[14px] leading-relaxed" style={{ color: T.primaryDeep, fontFamily: "var(--font-body)" }}>{doc.overallSummary}</p>
                </Card>
              )}
              {(doc.explanations || []).map((ex) => (
                <Card key={ex.test_name} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13.5px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>{ex.test_name}</span>
                    <StatusPill status={ex.severity} />
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: T.inkSoft, fontFamily: "var(--font-body)" }}>{ex.simple_summary}</p>
                </Card>
              ))}
              <p className="text-[11.5px]" style={{ color: T.muted, fontFamily: "var(--font-body)" }}>
                These explanations are informational and don't replace a conversation with your doctor.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {Object.entries(grouped).map(([category, tests]) => (
                <Card key={category} className="overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ background: T.canvasAlt }}>
                    <div className="flex items-center gap-2">
                      <FlaskConical size={15} color={T.primary} />
                      <span className="text-[13.5px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>{category}</span>
                    </div>
                    <span className="text-[11.5px]" style={{ color: T.muted }}>{(tests as any[]).length} parameters</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: T.border }}>
                    {(tests as any[]).map((r) => (
                      <div key={r.test_name} className="grid grid-cols-1 md:grid-cols-[1.3fr_0.9fr_1.4fr] gap-4 md:gap-6 px-5 py-4 items-center">
                        <div>
                          <div className="text-[13.5px] font-medium" style={{ color: T.ink, fontFamily: "var(--font-body)" }}>{r.test_name}</div>
                          <div className="text-[11.5px]" style={{ color: T.muted }}>{r.sample_type}{r.remarks ? ` · ${r.remarks}` : ""}</div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[16px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-mono)" }}>{r.value}</span>
                          <span className="text-[12px]" style={{ color: T.muted, fontFamily: "var(--font-mono)" }}>{r.unit}</span>
                          <StatusPill status={r.status} />
                        </div>
                        <VitalisLine value={r.value} low={r.reference_range.low} high={r.reference_range.high} status={r.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6">
            <ExplainChat docTitle={doc.title} />
          </div>
        </>
      )}

      {doc.type === "prescription" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(doc.medicines || []).map((m) => (
            <Card key={m.medicine_name} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: T.primaryTint }}>
                    <Pill size={17} color={T.primary} />
                  </div>
                  <div>
                    <div className="text-[14.5px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>{m.medicine_name}</div>
                    <div className="text-[12px]" style={{ color: T.muted, fontFamily: "var(--font-mono)" }}>{m.strength}</div>
                  </div>
                </div>
                <span className="text-[10.5px] font-semibold px-2 py-1 rounded-full" style={{ background: T.canvasAlt, color: T.inkSoft }}>{m.route}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ label: "Dose", value: m.dose }, { label: "Frequency", value: m.frequency }, { label: "Duration", value: m.duration }].map((f) => (
                  <div key={f.label} className="rounded-lg p-2.5" style={{ background: T.canvasAlt }}>
                    <div className="text-[10px] font-medium mb-0.5" style={{ color: T.muted }}>{f.label.toUpperCase()}</div>
                    <div className="text-[12.5px] font-medium" style={{ color: T.ink, fontFamily: "var(--font-body)" }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {m.instructions && (
                <div className="flex items-start gap-1.5 text-[12px]" style={{ color: T.inkSoft }}>
                  <Sparkles size={13} className="mt-0.5 shrink-0" color={T.gold} />
                  {m.instructions}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
