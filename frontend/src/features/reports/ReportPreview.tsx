"use client";

import { ArrowLeft, Download, ScanSearch } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { QueryState } from "@/components/ui/States";
import type { ReportDetail } from "@/types/models";
import { ReportDocument } from "./ReportDocument";

interface ReportPreviewProps {
  report?: ReportDetail;
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
  backHref: string;
  scanHref?: string;
}

/** Report toolbar + document. "Download PDF" uses the browser's print-to-PDF with print styles. */
export function ReportPreview({ report, isLoading, error, onRetry, backHref, scanHref }: ReportPreviewProps) {
  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <LinkButton href={backHref} variant="ghost" icon={<ArrowLeft className="size-4" />}>Back to reports</LinkButton>
        {report && (
          <div className="flex gap-2">
            {scanHref && <LinkButton href={scanHref} variant="outline" icon={<ScanSearch className="size-4" />}>Open scan</LinkButton>}
            <Button variant="dark" icon={<Download className="size-4" />} onClick={() => window.print()}>Download PDF</Button>
          </div>
        )}
      </div>
      <QueryState isLoading={isLoading} error={error} onRetry={onRetry}>
        {report && <ReportDocument report={report} />}
      </QueryState>
    </>
  );
}
