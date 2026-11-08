import type { ReactNode } from "react";
import { XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/States";
import type { Scan } from "@/types/models";
import { ScanResults } from "./ScanResults";
import { ScanSummary } from "./ScanSummary";

/** Shared scan detail layout used by the user and admin scan pages. */
export function ScanDetailView({ scan, actions }: { scan: Scan; actions?: ReactNode }) {
  const results = scan.results ?? [];
  const active = scan.status === "QUEUED" || scan.status === "RUNNING";

  return (
    <div className="space-y-6">
      {actions && <div className="flex flex-wrap justify-end gap-2">{actions}</div>}
      <ScanSummary scan={scan} />
      {scan.status === "FAILED" && (
        <Card>
          <EmptyState icon={<XCircle />} title="This scan failed" description={scan.error ?? "The website could not be scanned."} />
        </Card>
      )}
      {results.length > 0 ? (
        <ScanResults results={results} categoryScores={scan.categoryScores} />
      ) : (
        active && <Card><LoadingState label="Results will appear here as checks complete…" /></Card>
      )}
    </div>
  );
}
