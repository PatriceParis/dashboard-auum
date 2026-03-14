import { loadDashboardData } from "@/lib/data-loader";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Home() {
  const data = loadDashboardData();

  return (
    <main className="min-h-screen">
      <DashboardShell data={data} />
    </main>
  );
}
