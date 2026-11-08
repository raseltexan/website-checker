"use client";

import Link from "next/link";
import { AlertTriangle, Gauge, Globe, ScanSearch } from "lucide-react";
import { TrendChart } from "@/components/charts/TrendChart";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScorePill } from "@/components/ui/ScoreRing";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useGetDashboardQuery } from "@/services/userApi";
import { ScanStatusBadge } from "@/features/scans/StatusBadges";
import { formatDate, hostname, timeAgo } from "@/utils/format";
import { UsageCard } from "./UsageCard";

export function DashboardView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useGetDashboardQuery(undefined, { pollingInterval: 15_000, skipPollingIfUnfocused: true });

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const stats = data?.stats;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Here's how your websites are performing."
        actions={<LinkButton href="/dashboard/checker" icon={<ScanSearch className="size-4" />}>New scan</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Average score" value={stats?.averageScore ?? "—"} icon={<Gauge />} hint="Completed scans, last 30 days" highlight loading={isLoading} />
        <StatCard label="Websites" value={stats?.websites ?? 0} icon={<Globe />} loading={isLoading} />
        <StatCard label="Total scans" value={stats?.totalScans ?? 0} icon={<ScanSearch />} hint={stats?.activeScans ? `${stats.activeScans} in progress` : undefined} loading={isLoading} />
        <StatCard label="Failed checks" value={stats?.issuesFound ?? 0} icon={<AlertTriangle />} hint="Last 30 days" loading={isLoading} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Score trend" description="Overall score of completed scans over the last 30 days" />
          <CardBody>
            {data?.scoreTrend.length ? (
              <TrendChart data={data.scoreTrend.map((p) => ({ label: formatDate(p.date), value: p.score }))} valueLabel="Score" domain={[0, 100]} />
            ) : (
              <EmptyState title="No completed scans yet" description="Run your first scan to start tracking scores." />
            )}
          </CardBody>
        </Card>
        {data && <UsageCard plan={data.plan} usage={data.usage} />}
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent scans" action={<LinkButton href="/dashboard/scans" variant="outline" size="sm">View all</LinkButton>} />
        {data?.recentScans.length ? (
          <ul className="divide-y divide-line">
            {data.recentScans.map((s) => (
              <li key={s.id}>
                <Link href={`/dashboard/scans/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-canvas/60">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{hostname(s.url)}</p>
                    <p className="text-xs text-muted">{timeAgo(s.createdAt)}</p>
                  </div>
                  <ScanStatusBadge status={s.status} />
                  <ScorePill score={s.status === "COMPLETED" ? s.score : null} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && <EmptyState icon={<ScanSearch />} title="No scans yet" description="Audit your first website in under a minute." action={<LinkButton href="/dashboard/checker" size="sm">Run a scan</LinkButton>} />
        )}
      </Card>
    </>
  );
}
