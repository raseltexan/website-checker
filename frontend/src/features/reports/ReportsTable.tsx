import Link from "next/link";
import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { ScorePill } from "@/components/ui/ScoreRing";
import type { PaginationMeta } from "@/types/api";
import type { Report } from "@/types/models";
import { formatDateTime } from "@/utils/format";

interface ReportsTableProps {
  rows?: Report[];
  meta?: PaginationMeta;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
  href: (r: Report) => string;
  showUser?: boolean;
  actions?: (r: Report) => ReactNode;
}

export function ReportsTable({ rows, meta, isLoading, error, onRetry, onPageChange, href, showUser, actions }: ReportsTableProps) {
  return (
    <DataTable
      rows={rows}
      meta={meta}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onPageChange={onPageChange}
      rowKey={(r) => r.id}
      empty={{ icon: <FileText />, title: "No reports yet", description: "A report is generated automatically when a scan completes." }}
      columns={[
        {
          header: "Report",
          cell: (r) => (
            <Link href={href(r)} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-100"><FileText className="size-4" /></span>
              <span className="min-w-0">
                <span className="block truncate font-bold hover:underline">{r.title}</span>
                <span className="block max-w-64 truncate text-xs text-muted">{r.url}</span>
              </span>
            </Link>
          ),
        },
        ...(showUser ? [{ header: "User", hideOnMobile: true, cell: (r: Report) => <span className="text-xs">{r.user?.email}</span> }] : []),
        { header: "Score", cell: (r) => <ScorePill score={r.score} /> },
        { header: "Failed", hideOnMobile: true, cell: (r) => <span className="font-semibold text-danger">{r.scan?.summary?.FAIL ?? 0}</span> },
        { header: "Generated", hideOnMobile: true, cell: (r) => <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span> },
        ...(actions ? [{ header: "Actions", className: "text-right", cell: (r: Report) => <div className="flex justify-end gap-1">{actions(r)}</div> }] : []),
      ]}
    />
  );
}
