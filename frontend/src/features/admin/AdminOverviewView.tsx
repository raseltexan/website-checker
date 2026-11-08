"use client";

import Link from "next/link";
import { Activity, FileText, Gauge, Globe, ScanSearch, Users } from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScorePill } from "@/components/ui/ScoreRing";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { ScanStatusBadge } from "@/features/scans/StatusBadges";
import { ADMIN_BASE } from "@/lib/navigation";
import { useGetAdminOverviewQuery } from "@/services/adminApi";
import { hostname, timeAgo } from "@/utils/format";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function AdminOverviewView() {
  const { data, isLoading, error, refetch } = useGetAdminOverviewQuery(undefined, { pollingInterval: 30_000, skipPollingIfUnfocused: true });
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const t = data?.totals;
  const m = data?.last30Days;

  return (
    <>
      <PageHeader eyebrow="Admin" title="Overview & Analytics" description="Platform-wide activity across all users." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard label="Total users" value={t?.users ?? 0} icon={<Users />} hint={m ? `+${m.newUsers} in the last 30 days` : undefined} highlight loading={isLoading} />
        <StatCard label="Websites" value={t?.websites ?? 0} icon={<Globe />} loading={isLoading} />
        <StatCard label="Total scans" value={t?.scans ?? 0} icon={<ScanSearch />} hint={t ? `${t.activeScans} active right now` : undefined} loading={isLoading} />
        <StatCard label="Reports generated" value={t?.reports ?? 0} icon={<FileText />} loading={isLoading} />
        <StatCard label="Avg. score (30d)" value={m?.averageScore ?? "—"} icon={<Gauge />} loading={isLoading} />
        <StatCard label="Failed scans (30d)" value={m?.failedScans ?? 0} icon={<Activity />} hint={m ? `of ${m.scans} scans` : undefined} loading={isLoading} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Scans per day" description="Last 30 days" />
          <CardBody>{data && <TrendChart data={data.charts.scansPerDay.map((p) => ({ label: shortDate(p.date), value: p.value }))} valueLabel="Scans" />}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Plan distribution" description="Active subscriptions by plan" />
          <CardBody>{data && <DonutChart data={data.charts.planDistribution} />}</CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="New sign-ups" description="Last 30 days" />
          <CardBody>{data && <TrendChart data={data.charts.signupsPerDay.map((p) => ({ label: shortDate(p.date), value: p.value }))} valueLabel="Sign-ups" height={200} />}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent scans" action={<LinkButton href={`${ADMIN_BASE}/scans`} variant="outline" size="sm">All</LinkButton>} />
          <ul className="divide-y divide-line">
            {data?.recentScans.map((s) => (
              <li key={s.id}>
                <Link href={`${ADMIN_BASE}/scans/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas/60">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{hostname(s.url)}</p>
                    <p className="truncate text-xs text-muted">{s.user.email} · {timeAgo(s.createdAt)}</p>
                  </div>
                  <ScanStatusBadge status={s.status} />
                  <ScorePill score={s.status === "COMPLETED" ? s.score : null} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
