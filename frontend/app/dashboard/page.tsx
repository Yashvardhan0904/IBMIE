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
    <div className="space-y-8">

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
  );
}
