import Link from "next/link";
import {
  FileText,
  FlaskConical,
  Pill,
  ChevronRight,
} from "lucide-react";

interface Props {
  docs: any[];
}

export default function RecentReports({
  docs,
}: Props) {
  return (
    <section className="rounded-[36px] bg-white p-8 shadow-sm ring-1 ring-slate-100">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <p className="text-sm uppercase tracking-widest text-slate-500">
            Reports
          </p>

          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Recent Medical Reports
          </h2>

        </div>

        <Link
          href="/reports"
          className="text-emerald-600 font-medium"
        >
          View All
        </Link>

      </div>

      <div className="space-y-4">

        {docs.slice(0, 5).map((doc) => (

          <Link
            key={doc.id}
            href={`/reports/${doc.id}`}
            className="flex items-center justify-between rounded-2xl border border-slate-100 p-5 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >

            <div className="flex items-center gap-5">

              <div className="rounded-2xl bg-slate-100 p-4">

                {doc.type === "prescription" ? (
                  <Pill
                    className="text-emerald-600"
                    size={20}
                  />
                ) : (
                  <FlaskConical
                    className="text-emerald-600"
                    size={20}
                  />
                )}

              </div>

              <div>

                <h3 className="font-semibold text-slate-900">
                  {doc.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {doc.category} • {doc.date}
                </p>

              </div>

            </div>

            <ChevronRight className="text-slate-400" />

          </Link>

        ))}

        {docs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">

            <FileText
              className="mx-auto text-slate-300"
              size={44}
            />

            <h3 className="mt-5 text-lg font-semibold text-slate-800">
              No reports uploaded yet
            </h3>

            <p className="mt-2 text-slate-500">
              Upload your first report to let Vitalis
              analyze and organize your health history.
            </p>

          </div>
        )}

      </div>

    </section>
  );
}