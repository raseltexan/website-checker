import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/ui/States";
import { AppProviders } from "@/redux/AppProviders";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders fallback={<LoadingState label="Loading your workspace…" className="min-h-screen" />}>
      <DashboardShell>{children}</DashboardShell>
    </AppProviders>
  );
}
