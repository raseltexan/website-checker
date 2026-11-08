import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { formatDateTime } from "@/utils/format";
import type { Scan } from "@/types/models";
import { ScanStatusBadge } from "./StatusBadges";

const COUNTERS = [
  { key: "PASS", label: "Passed", cls: "text-success" },
  { key: "WARN", label: "Warnings", cls: "text-warning" },
  { key: "FAIL", label: "Failed", cls: "text-danger" },
  { key: "UNAVAILABLE", label: "Unavailable", cls: "text-muted" },
] as const;

export function ScanSummary({ scan }: { scan: Scan }) {
  const counts = scan.results?.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {}) ?? {};
  const duration = scan.startedAt && scan.completedAt ? Math.round((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000) : null;

  return (
    <Card className="print-break grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[auto_1fr]">
      <div className="flex justify-center">
        <ScoreRing score={scan.status === "COMPLETED" ? scan.score : null} size={140} label="Overall" />
      </div>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ScanStatusBadge status={scan.status} />
          {scan.website && <span className="text-xs font-semibold text-muted">· {scan.website.name}</span>}
        </div>
        <a href={scan.finalUrl ?? scan.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-lg font-extrabold break-all hover:underline">
          {scan.finalUrl ?? scan.url} <ExternalLink className="no-print size-4 shrink-0 text-muted" />
        </a>
        <p className="text-xs text-muted">
          Started {formatDateTime(scan.startedAt ?? scan.createdAt)}
          {duration !== null && ` · Took ${duration}s`}
        </p>
        {(scan.status === "RUNNING" || scan.status === "QUEUED") && (
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span>{scan.status === "QUEUED" ? "Waiting in queue…" : "Running checks…"}</span>
              <span>{scan.progress}%</span>
            </div>
            <ProgressBar value={scan.progress} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COUNTERS.map((c) => (
            <div key={c.key} className="rounded-lg border border-line px-3 py-2">
              <p className={`text-xl font-extrabold ${c.cls}`}>{counts[c.key] ?? 0}</p>
              <p className="text-xs font-semibold text-muted">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
