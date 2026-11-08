import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { ScorePill, ScoreRing } from "@/components/ui/ScoreRing";
import { CategoryIcon } from "@/lib/categoryIcons";
import { ScanResults } from "@/features/scans/ScanResults";
import { CHECK_STATUS, SeverityBadge } from "@/features/scans/StatusBadges";
import type { ReportDetail, Severity } from "@/types/models";
import { formatDateTime } from "@/utils/format";

const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const scoreVerdict = (score: number) =>
  score >= 90 ? "Excellent" : score >= 80 ? "Good" : score >= 60 ? "Needs improvement" : score >= 40 ? "Poor" : "Critical";

/** Print-friendly report layout. Printing from the browser produces the PDF. */
export function ReportDocument({ report }: { report: ReportDetail }) {
  const results = report.scan.results;
  const topIssues = results
    .filter((r) => r.status === "FAIL" || r.status === "WARN")
    .sort((a, b) => (a.status === b.status ? SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] : a.status === "FAIL" ? -1 : 1))
    .slice(0, 8);
  const count = (s: string) => results.filter((r) => r.status === s).length;

  return (
    <article className="print-area mx-auto max-w-4xl space-y-6">
      <Card className="print-area overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-ink px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Texan" width={40} height={40} />
            <div>
              <p className="text-lg font-extrabold tracking-tight">TEXAN</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-brand uppercase">Website Audit Report</p>
            </div>
          </div>
          <div className="text-right text-xs text-white/70">
            <p>Generated {formatDateTime(report.createdAt)}</p>
            <p>Prepared for {report.user.company || report.user.name}</p>
          </div>
        </div>
        <div className="h-1.5 bg-brand" />
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={report.score} size={150} label="Overall" className="mx-auto" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{report.title}</h1>
            <p className="mt-1 text-sm break-all text-muted">{report.url}</p>
            <p className="mt-3 inline-block rounded-md bg-brand-100 px-2.5 py-1 text-sm font-bold">{scoreVerdict(report.score)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["PASS", "WARN", "FAIL", "UNAVAILABLE"] as const).map((s) => (
                <div key={s} className="rounded-lg border border-line px-3 py-2">
                  <p className={`text-xl font-extrabold ${CHECK_STATUS[s].color}`}>{count(s)}</p>
                  <p className="text-xs font-semibold text-muted">{CHECK_STATUS[s].label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="print-break p-6">
        <h2 className="text-lg font-extrabold">Category scores</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.categories.map((c) => {
            return (
              <div key={c.key} className="flex items-center gap-3 rounded-lg border border-line p-3">
                <span className="grid size-9 place-items-center rounded-lg bg-brand text-ink"><CategoryIcon icon={c.icon} className="size-4" /></span>
                <span className="flex-1 text-sm font-bold">{c.name}</span>
                <ScorePill score={report.scan.categoryScores?.[c.key] ?? null} />
              </div>
            );
          })}
        </div>
      </Card>

      {topIssues.length > 0 && (
        <Card className="print-break p-6">
          <h2 className="text-lg font-extrabold">Priority issues</h2>
          <p className="text-sm text-muted">The most important problems to fix first, ordered by severity.</p>
          <ol className="mt-4 space-y-3">
            {topIssues.map((r, i) => (
              <li key={r.id} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-brand">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{r.name}</p>
                    <SeverityBadge severity={r.severity} />
                  </div>
                  <p className="text-sm text-muted">{r.message}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Detailed results</h2>
        <ScanResults results={results} categoryScores={report.scan.categoryScores} categories={report.categories} />
      </section>

      <p className="pb-6 text-center text-xs text-muted">
        Checks marked “Unavailable” require an integration that is not configured and are excluded from scoring.
      </p>
    </article>
  );
}
