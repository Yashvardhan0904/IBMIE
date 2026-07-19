"use client";

import { Search, ArrowDownCircle, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { T, STATUS_STYLE, StatusKey } from "@/lib/tokens";

export function StatusPill({ status }: { status: StatusKey }) {
  const icons = { LOW: ArrowDownCircle, NORMAL: CheckCircle2, HIGH: AlertTriangle, CRITICAL: AlertOctagon };
  const s = STATUS_STYLE[status];
  const Icon = icons[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg, fontFamily: "var(--font-body)" }}
    >
      <Icon size={13} strokeWidth={2.4} />
      {s.label}
    </span>
  );
}

/* Signature visual: the "Vitalis Line" — shows exactly where a value
   falls relative to its reference range. */
export function VitalisLine({
  value,
  low,
  high,
  status,
}: {
  value: number;
  low: number | null;
  high: number | null;
  status: StatusKey;
}) {
  const color = STATUS_STYLE[status].fg;

  const hasLow = typeof low === "number";
  const hasHigh = typeof high === "number";
  const span = hasLow && hasHigh ? (high as number) - (low as number) : Math.max(Math.abs(value), 1);
  const pad = span * 0.55 || Math.max(value * 0.4, 1);

  const domainMin = (hasLow ? (low as number) : value) - pad;
  const domainMax = (hasHigh ? (high as number) : value) + pad;
  const width = domainMax - domainMin || 1;

  const pct = (n: number) => Math.min(100, Math.max(0, ((n - domainMin) / width) * 100));
  const lowPct = hasLow ? pct(low as number) : 0;
  const highPct = hasHigh ? pct(high as number) : 100;
  const valuePct = pct(value);

  return (
    <div className="w-full select-none" style={{ fontFamily: "var(--font-mono)" }}>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: T.canvasAlt }}>
        <div className="absolute inset-y-0" style={{ left: `${lowPct}%`, width: `${Math.max(highPct - lowPct, 1.5)}%`, background: T.primaryTint }} />
        <div className="absolute inset-y-0" style={{ left: `${lowPct}%`, width: 2, background: T.borderStrong }} />
        <div className="absolute inset-y-0" style={{ left: `${highPct}%`, width: 2, background: T.borderStrong }} />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2"
          style={{ left: `calc(${valuePct}% - 7px)`, transform: "translateY(-50%)", background: color, borderColor: T.card, boxShadow: "0 0 0 1px " + color }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: T.muted }}>
        <span>{hasLow ? low : "—"}</span>
        <span className="opacity-70">reference</span>
        <span>{hasHigh ? high : "—"}</span>
      </div>
    </div>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
      <div>
        <h1 className="text-[22px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>{title}</h1>
        {subtitle && <p className="text-[13px] mt-0.5" style={{ color: T.muted, fontFamily: "var(--font-body)" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full max-w-xs" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(17, 31, 29, 0.05)" }}>
        <Search size={15} color={T.muted} />
        <input
          placeholder="Search reports, medicines…"
          className="bg-transparent outline-none text-[13px] w-full"
          style={{ color: T.ink, fontFamily: "var(--font-body)" }}
        />
      </div>
    </div>
  );
}

export function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        boxShadow: "0 18px 45px rgba(17, 31, 29, 0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
