"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { ScorePill } from "@/components/ui/ScoreRing";
import { Tabs } from "@/components/ui/Tabs";
import { CategoryIcon } from "@/lib/categoryIcons";
import type { CheckStatus, ScanResult } from "@/types/models";
import { ResultItem } from "./ResultItem";

type Filter = "ALL" | "ISSUES" | CheckStatus;

interface CategoryMeta {
  key: string;
  name: string;
  icon?: string;
}

interface ScanResultsProps {
  results: ScanResult[];
  categoryScores?: Record<string, number | null> | null;
  categories?: CategoryMeta[];
}

const FALLBACK_NAMES: Record<string, string> = {
  seo: "SEO", performance: "Performance", security: "Security Headers", ssl: "SSL / TLS", accessibility: "Accessibility",
  content: "Links & Content", technical: "Mobile & Technical", dns: "Email & DNS", browser: "Browser & Device",
};

const matches = (r: ScanResult, f: Filter) => f === "ALL" || (f === "ISSUES" ? r.status === "FAIL" || r.status === "WARN" || r.status === "ERROR" : r.status === f);

/** Results grouped by category with status filter tabs. */
export function ScanResults({ results, categoryScores, categories }: ScanResultsProps) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const groups = useMemo(() => {
    const order = categories?.map((c) => c.key) ?? Object.keys(FALLBACK_NAMES);
    const keys = [...new Set(results.map((r) => r.categoryKey))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return keys.map((key) => {
      const meta = categories?.find((c) => c.key === key);
      return { key, name: meta?.name ?? FALLBACK_NAMES[key] ?? key, icon: meta?.icon ?? key, items: results.filter((r) => r.categoryKey === key && matches(r, filter)) };
    });
  }, [results, categories, filter]);

  const count = (f: Filter) => results.filter((r) => matches(r, f)).length;
  const visible = groups.filter((g) => g.items.length);

  return (
    <div className="space-y-4">
      <Tabs
        value={filter}
        onChange={setFilter}
        className="no-print"
        options={[
          { value: "ALL", label: "All", count: results.length },
          { value: "ISSUES", label: "Issues", count: count("ISSUES") },
          { value: "FAIL", label: "Failed", count: count("FAIL") },
          { value: "WARN", label: "Warnings", count: count("WARN") },
          { value: "PASS", label: "Passed", count: count("PASS") },
          { value: "UNAVAILABLE", label: "Unavailable", count: count("UNAVAILABLE") },
        ]}
      />
      {!visible.length && <Card><EmptyState title="No results match this filter" /></Card>}
      {visible.map((group) => {
        return (
          <Card key={group.key} className="print-break overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-canvas/60 px-5 py-3">
              <span className="grid size-8 place-items-center rounded-lg bg-brand text-ink"><CategoryIcon icon={group.icon} className="size-4" /></span>
              <h3 className="flex-1 font-bold">{group.name}</h3>
              <ScorePill score={categoryScores?.[group.key] ?? null} />
            </div>
            <ul className="divide-y divide-line">
              {group.items.map((r) => <ResultItem key={r.id} result={r} />)}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
