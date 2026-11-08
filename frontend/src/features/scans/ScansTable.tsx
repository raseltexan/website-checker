import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScorePill } from "@/components/ui/ScoreRing";
import type { PaginationMeta } from "@/types/api";
import type { Scan } from "@/types/models";
import { formatDateTime, hostname } from "@/utils/format";
import { ScanStatusBadge } from "./StatusBadges";

interface ScansTableProps {
  rows?: Scan[];
  meta?: PaginationMeta;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
  detailHref: (scan: Scan) => string;
  showUser?: boolean;
  actions?: (scan: Scan) => ReactNode;
  emptyAction?: ReactNode;
}

export function ScansTable({ rows, meta, isLoading, error, onRetry, onPageChange, detailHref, showUser, actions, emptyAction }: ScansTableProps) {
  const columns: Column<Scan>[] = [
    {
      header: "Website",
      cell: (s) => (
        <Link href={detailHref(s)} className="block min-w-0">
          <p className="truncate font-bold hover:underline">{hostname(s.url)}</p>
          <p className="max-w-64 truncate text-xs text-muted">{s.url}</p>
        </Link>
      ),
    },
    ...(showUser ? [{ header: "User", hideOnMobile: true, cell: (s: Scan) => <span className="text-xs">{s.user?.email}</span> }] : []),
    {
      header: "Status",
      cell: (s) =>
        s.status === "RUNNING" ? (
          <div className="w-28 space-y-1">
            <ScanStatusBadge status={s.status} />
            <ProgressBar value={s.progress} className="h-1.5" />
          </div>
        ) : (
          <ScanStatusBadge status={s.status} />
        ),
    },
    { header: "Score", cell: (s) => <ScorePill score={s.status === "COMPLETED" ? s.score : null} /> },
    { header: "Issues", hideOnMobile: true, cell: (s) => <span className="font-semibold">{s.summary ? (s.summary.FAIL ?? 0) + (s.summary.WARN ?? 0) : "—"}</span> },
    { header: "Started", hideOnMobile: true, cell: (s) => <span className="text-xs text-muted">{formatDateTime(s.createdAt)}</span> },
    ...(actions ? [{ header: "Actions", className: "text-right", cell: (s: Scan) => <div className="flex justify-end gap-1">{actions(s)}</div> }] : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      meta={meta}
      onPageChange={onPageChange}
      empty={{ title: "No scans yet", description: "Scans you run will show up here.", action: emptyAction }}
    />
  );
}
