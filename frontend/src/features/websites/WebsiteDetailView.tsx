"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Pencil, ScanSearch } from "lucide-react";
import { TrendChart } from "@/components/charts/TrendChart";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScorePill, ScoreRing } from "@/components/ui/ScoreRing";
import { EmptyState, QueryState } from "@/components/ui/States";
import { useGetWebsiteQuery } from "@/services/websitesApi";
import { ScanStatusBadge } from "@/features/scans/StatusBadges";
import { formatDate, formatDateTime } from "@/utils/format";
import { WebsiteFormModal } from "./WebsiteFormModal";

export function WebsiteDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: website, isLoading, error, refetch } = useGetWebsiteQuery(id);
  const [editOpen, setEditOpen] = useState(false);
  const trend = (website?.scans ?? []).filter((s) => s.status === "COMPLETED" && s.score !== null).reverse();

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
      {website && (
        <>
          <PageHeader
            eyebrow="Website"
            title={website.name}
            description={website.url}
            actions={
              <>
                <Button variant="outline" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>Edit</Button>
                <LinkButton href={`/dashboard/checker?url=${encodeURIComponent(website.url)}&websiteId=${website.id}`} icon={<ScanSearch className="size-4" />}>Scan now</LinkButton>
              </>
            }
          />
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center gap-4 p-6 text-center">
              <ScoreRing score={website.lastScore} size={150} label="Latest" />
              <div className="space-y-1 text-sm">
                <a href={website.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold hover:underline">
                  {website.domain} <ExternalLink className="size-3.5" />
                </a>
                <p className="text-muted">{website._count?.scans ?? 0} scans · {website._count?.reports ?? 0} reports</p>
                <p className="text-muted">Added {formatDate(website.createdAt)}</p>
              </div>
              {website.tags.length > 0 && <div className="flex flex-wrap justify-center gap-1">{website.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Score history" description="Last 10 scans" />
              <CardBody>
                {trend.length > 1 ? (
                  <TrendChart data={trend.map((s) => ({ label: formatDate(s.completedAt ?? s.createdAt), value: s.score ?? 0 }))} valueLabel="Score" domain={[0, 100]} />
                ) : (
                  <EmptyState title="Not enough data yet" description="Run at least two scans to see a trend." />
                )}
              </CardBody>
            </Card>
          </div>
          <Card className="mt-6">
            <CardHeader title="Recent scans" action={<LinkButton href={`/dashboard/scans`} variant="outline" size="sm">All scans</LinkButton>} />
            {website.scans?.length ? (
              <ul className="divide-y divide-line">
                {website.scans.map((s) => (
                  <li key={s.id}>
                    <Link href={`/dashboard/scans/${s.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-canvas/60">
                      <span className="flex-1 text-sm font-semibold">{formatDateTime(s.createdAt)}</span>
                      <ScanStatusBadge status={s.status} />
                      <ScorePill score={s.status === "COMPLETED" ? s.score : null} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No scans for this website yet" />
            )}
          </Card>
          <WebsiteFormModal open={editOpen} onClose={() => setEditOpen(false)} website={website} />
        </>
      )}
    </QueryState>
  );
}
