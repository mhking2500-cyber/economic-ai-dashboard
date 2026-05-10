import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { fetchFearGreed } from "@/lib/api-clients/feargreed";
import { getDashboardNews, getDashboardQuotes, getDefaultAiImpact } from "@/lib/services/dashboard";
import { checkEnv } from "@/lib/utils/env";
import Loading from "./loading";

async function DashboardData() {
  checkEnv();
  const [quotes, news, fearGreed] = await Promise.all([
    getDashboardQuotes(),
    getDashboardNews(),
    fetchFearGreed()
  ]);
  const impacts = getDefaultAiImpact();

  return (
    <DashboardClient
      initialQuotes={quotes}
      initialNews={news}
      initialImpacts={impacts}
      initialFearGreed={fearGreed}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardData />
    </Suspense>
  );
}
