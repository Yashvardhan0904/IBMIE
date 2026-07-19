import Sidebar from "@/components/Sidebar";

import DashboardHero from "@/components/dashboard/DashboardHero";
import HealthOverview from "@/components/dashboard/HealthOverview";
import RecentReports from "@/components/dashboard/RecentReports";
import AIInsights from "@/components/dashboard/AIInsights";
import DailyCare from "@/components/dashboard/DailyCare";
import QuickActions from "@/components/dashboard/QuickActions";
import UpcomingReminder from "@/components/dashboard/UpcomingReminder";
import HealthJourney from "@/components/dashboard/HealthJourney";

import { getMedicalDocuments } from "@/lib/api";

export default async function DashboardPage() {
  const docs = await getMedicalDocuments();

  return (
    <div className="min-h-screen bg-[#F6FBF8]">

      {/* Background */}

      <div className="fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute left-0 top-0 h-[450px] w-[450px] rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-lime-100/40 blur-3xl" />

      </div>

      <Sidebar />

      <main className="lg:ml-72">

        <div className="mx-auto max-w-7xl px-8 py-10 space-y-8">

          {/* HERO */}

          <DashboardHero />

          {/* HEALTH OVERVIEW */}

          <HealthOverview />

          {/* REPORTS + DAILY CARE */}

          <section className="grid gap-8 xl:grid-cols-3">

            <div className="xl:col-span-2">
              <RecentReports docs={docs} />
            </div>

            <DailyCare />

          </section>

          {/* AI + REMINDER */}

          <section className="grid gap-8 xl:grid-cols-3">

            <div className="xl:col-span-2">
              <AIInsights />
            </div>

            <UpcomingReminder />

          </section>

          {/* JOURNEY + ACTIONS */}

          <section className="grid gap-8 xl:grid-cols-3">

            <div className="xl:col-span-2">
              <HealthJourney />
            </div>

            <QuickActions />

          </section>

        </div>

      </main>

    </div>
  );
}