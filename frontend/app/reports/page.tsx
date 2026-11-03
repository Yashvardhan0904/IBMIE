import Link from "next/link";
import { FlaskConical, Pill } from "lucide-react";
import { T } from "@/lib/tokens";
import { TopBar, Card } from "@/components/UI";
import { getMedicalDocuments } from "@/lib/api";

export default async function ReportsPage() {
  const docs = await getMedicalDocuments();

  return (
    <div>
      <TopBar title="My reports" subtitle="Every document you've uploaded, structured and explained" />
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ background: T.canvasAlt }}>
              {["Document", "Category", "Date", "Method", "Confidence", ""].map((h) => (
                <th key={h} className="text-[11px] font-semibold tracking-wide px-5 py-3" style={{ color: T.muted }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[13px]" style={{ color: T.muted }}>
                  No backend documents found yet. Upload a PDF to analyze it.
                </td>
              </tr>
            )}
            {docs.map((d) => (
              <tr key={d.id} className="border-t" style={{ borderColor: T.border }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {d.type === "prescription" ? <Pill size={15} color={T.primary} /> : <FlaskConical size={15} color={T.primary} />}
                    <span className="text-[13px] font-medium" style={{ color: T.ink, fontFamily: "var(--font-body)" }}>{d.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: T.inkSoft }}>{d.category}</td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: T.inkSoft, fontFamily: "var(--font-mono)" }}>{d.date}</td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: T.inkSoft }}>{d.ocrUsed ? "OCR" : "Digital text"}</td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: T.inkSoft, fontFamily: "var(--font-mono)" }}>{typeof d.confidence === "number" ? `${Math.round(d.confidence * 100)}%` : "—"}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/reports/${d.id}`} className="text-[12.5px] font-semibold" style={{ color: T.primary }}>Open →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
