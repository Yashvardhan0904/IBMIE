"use client";

const milestones = [
  {
    title: "First Report Uploaded",
    done: true,
  },
  {
    title: "Health Profile Completed",
    done: true,
  },
  {
    title: "7 Day Activity Streak",
    done: true,
  },
  {
    title: "Upload 10 Reports",
    done: false,
  },
];

export default function HealthJourney() {
  return (
    <section className="rounded-[34px] bg-white p-8 shadow-sm ring-1 ring-slate-100">

      <p className="text-sm uppercase tracking-[0.25em] text-emerald-600">
        Progress
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-slate-900">
        Your Journey
      </h2>

      <div className="mt-8 space-y-6">

        {milestones.map((item) => (

          <div
            key={item.title}
            className="flex items-center gap-4"
          >

            <div
              className={`h-5 w-5 rounded-full border-2 ${
                item.done
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-300"
              }`}
            />

            <div className="flex-1">

              <h3 className="font-medium text-slate-800">
                {item.title}
              </h3>

            </div>

          </div>

        ))}

      </div>

      <div className="mt-10">

        <div className="flex justify-between text-sm text-slate-500">

          <span>75% Complete</span>

          <span>3 / 4</span>

        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">

          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />

        </div>

      </div>

    </section>
  );
}