"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ScanResult } from "@/types/models";
import { CHECK_STATUS, SeverityBadge } from "./StatusBadges";

/** A single check result row with an expandable technical details panel. */
export function ResultItem({ result }: { result: ScanResult }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, color } = CHECK_STATUS[result.status];
  const hasDetails = result.details && Object.keys(result.details).length > 0;

  return (
    <li className="print-break">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        className={cn("flex w-full items-start gap-3 px-5 py-3.5 text-left", hasDetails && "hover:bg-canvas/60")}
        aria-expanded={hasDetails ? open : undefined}
      >
        <Icon className={cn("mt-0.5 size-[18px] shrink-0", color)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{result.name}</p>
            <SeverityBadge severity={result.severity} />
          </div>
          <p className="mt-0.5 text-sm break-words text-muted">{result.message}</p>
        </div>
        {hasDetails && <ChevronDown className={cn("no-print mt-1 size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />}
      </button>
      {open && hasDetails && (
        <pre className="scrollbar-thin mx-5 mb-4 max-h-72 overflow-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-white/90">
          {JSON.stringify(result.details, null, 2)}
        </pre>
      )}
    </li>
  );
}
