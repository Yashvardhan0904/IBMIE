import Link from "next/link";
import {
  FileText, Sparkles, AlertTriangle, ShieldCheck, ChevronRight,
  FlaskConical, Pill, UploadCloud, AlertOctagon, ListChecks, Flame,
  LogIn, UserRoundCog, MessageCircleHeart,
} from "lucide-react";
import { T } from "@/lib/tokens";
import { TopBar, Card } from "@/components/UI";
import { ProgressRing } from "@/components/Charts";
import { REMINDERS } from "@/lib/mock-data";
import { getMedicalDocuments } from "@/lib/api";
import { TODAY_MEALS, HABITS, CALORIE_TARGET, WATER_TARGET } from "@/lib/lifestyle-data";

export default async function DashboardPage() {
  const docs = await getMedicalDocuments();
  const allResults = docs.flatMap((d) => d.results || []);
  const abnormal = allResults.filter((r) => r.status !== "NORMAL").length;
  const urgentDoc = docs.find((d) => d.urgent);
  const activeReminders = REMINDERS.filter((r) => r.active).length;

  const stats = [
    { label: "Documents processed", value: docs.length, icon: FileText },
    { label: "Values extracted", value: allResults.length, icon: Sparkles },
    { label: "Flagged abnormal", value: abnormal, icon: AlertTriangle },
    { label: "Active reminders", value: activeReminders, icon: ShieldCheck },
  ];

  return (
    <div>
      <TopBar title="Good to see you" subtitle="Here's where things stand across your recent reports" />

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>
              Start with the real Vitalis flow
            </h2>
            <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>
              Login, add health context, upload reports, then ask Vitalis for simple explanations and routine suggestions.
            </p>
          </div>
          <Link href="/chat" className="rounded-lg px-3.5 py-2.5 text-[12.5px] font-semibold flex items-center gap-2" style={{ background: T.primary, color: "#fff" }}>
            <MessageCircleHeart size={15} /> Ask AI
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { href: "/login", label: "User login", icon: LogIn },
            { href: "/profile", label: "Health details", icon: UserRoundCog },
            { href: "/upload", label: "Reports upload", icon: UploadCloud },
            { href: "/chat", label: "AI suggestions", icon: MessageCircleHeart },
          ].map((step, index) => (
            <Link key={step.href} href={step.href} className="rounded-lg p-3 flex items-center gap-3" style={{ background: T.canvasAlt }}>
              <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: T.card }}>
                <step.icon size={15} color={T.primary} />
              </div>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: T.muted }}>STEP {index + 1}</div>
                <div className="text-[13px] font-semibold" style={{ color: T.ink }}>{step.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {urgentDoc?.urgent && (
        <Link
          href={`/reports/${urgentDoc.id}`}
          className="rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: T.criticalTint, border: `1px solid ${T.critical}` }}
        >
          <div className="flex items-start gap-3">
            <AlertOctagon size={20} color={T.critical} className="mt-0.5 shrink-0" />
            <div>
              <div className="text-[13.5px] font-semibold" style={{ color: T.critical, fontFamily: "var(--font-body)" }}>
                Flagged for prompt attention — {urgentDoc.urgent.test_name}
              </div>
              <p className="text-[12.5px] mt-0.5" style={{ color: T.inkSoft }}>{urgentDoc.urgent.message}</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold flex items-center gap-1 shrink-0" style={{ color: T.critical }}>
            View report <ChevronRight size={14} />
          </span>
        </Link>
      )}

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ListChecks size={16} color={T.primary} />
            <h3 className="text-[14px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>Today's lifestyle snapshot</h3>
          </div>
          <Link href="/track" className="text-[12px] font-medium flex items-center gap-1" style={{ color: T.primary }}>
            Open today's log <ChevronRight size={13} />
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-around gap-6">
          <ProgressRing value={4} target={WATER_TARGET} color={T.low} label="Water" sublabel={`4/${WATER_TARGET} glasses`} />
          <ProgressRing
            value={TODAY_MEALS.reduce((s, m) => s + m.calories, 0)}
            target={CALORIE_TARGET}
            color={T.gold}
            label="Calories"
            sublabel={`${TODAY_MEALS.reduce((s, m) => s + m.calories, 0)}/${CALORIE_TARGET} kcal`}
          />
          <ProgressRing value={HABITS.filter((h) => h.completedToday).length} target={HABITS.length} color={T.primary} label="Habits" sublabel={`${HABITS.filter((h) => h.completedToday).length}/${HABITS.length} done`} />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="h-8 w-8 rounded-md flex items-center justify-center mb-3" style={{ background: T.primaryTint }}>
              <s.icon size={16} color={T.primary} />
            </div>
            <div className="text-[22px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>{s.value}</div>
            <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>Recent reports</h3>
            <Link href="/reports" className="text-[12px] font-medium flex items-center gap-1" style={{ color: T.primary }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: T.border }}>
            {docs.length === 0 && (
              <div className="py-5 text-[13px]" style={{ color: T.muted }}>
                No backend documents yet. Upload a PDF to create your first record.
              </div>
            )}
            {docs.slice(0, 5).map((d) => (
              <Link key={d.id} href={`/reports/${d.id}`} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: T.canvasAlt }}>
                    {d.type === "prescription" ? <Pill size={16} color={T.primary} /> : <FlaskConical size={16} color={T.primary} />}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium" style={{ color: T.ink, fontFamily: "var(--font-body)" }}>{d.title}</div>
                    <div className="text-[11.5px]" style={{ color: T.muted }}>{d.category} · {d.date}</div>
                  </div>
                </div>
                <ChevronRight size={16} color={T.muted} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 flex flex-col">
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: T.ink, fontFamily: "var(--font-display)" }}>Quick actions</h3>
          <div className="flex flex-col gap-2.5 flex-1">
            <Link href="/track" className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ background: T.primaryTint }}>
              <ListChecks size={16} color={T.primary} />
              <span className="text-[13px] font-medium" style={{ color: T.primaryDeep }}>Log today's activity</span>
            </Link>
            <Link href="/upload" className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ background: T.canvasAlt }}>
              <UploadCloud size={16} color={T.inkSoft} />
              <span className="text-[13px] font-medium" style={{ color: T.inkSoft }}>Upload a new document</span>
            </Link>
            <Link href="/habits" className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ background: T.canvasAlt }}>
              <Flame size={16} color={T.inkSoft} />
              <span className="text-[13px] font-medium" style={{ color: T.inkSoft }}>Check habit streaks</span>
            </Link>
            <Link href="/reminders" className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ background: T.canvasAlt }}>
              <ShieldCheck size={16} color={T.inkSoft} />
              <span className="text-[13px] font-medium" style={{ color: T.inkSoft }}>Manage reminders</span>
            </Link>
            <Link href="/chat" className="flex items-center gap-2.5 rounded-lg px-3.5 py-3" style={{ background: T.canvasAlt }}>
              <MessageCircleHeart size={16} color={T.inkSoft} />
              <span className="text-[13px] font-medium" style={{ color: T.inkSoft }}>Ask Vitalis</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
