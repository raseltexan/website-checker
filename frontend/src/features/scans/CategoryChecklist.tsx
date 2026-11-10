"use client";

import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/lib/categoryIcons";
import type { CheckerCategory } from "@/types/models";
import { SeverityBadge } from "./StatusBadges";

interface CategoryChecklistProps {
  category: CheckerCategory;
  selected: Set<string>;
  onToggle: (keys: string[], checked: boolean) => void;
}

/** One category card: a tri-state "select all" checkbox plus expandable individual checks. */
export function CategoryChecklist({ category, selected, onToggle }: CategoryChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const available = category.checks.filter((c) => c.available);
  const optional = available.filter((c) => !c.mandatory);
  const unavailable = category.checks.length - available.length;
  const allMandatory = available.length > 0 && optional.length === 0;
  const selectedCount = available.filter((c) => c.mandatory || selected.has(c.key)).length;
  const allSelected = available.length > 0 && selectedCount === available.length;

  const summary = !available.length
    ? `Requires a browser integration · ${category.checks.length} check${category.checks.length === 1 ? "" : "s"}`
    : [
        allMandatory ? `${available.length} required check${available.length === 1 ? "" : "s"} · always run` : `${selectedCount}/${available.length} selected`,
        unavailable > 0 && `${unavailable} need${unavailable === 1 ? "s" : ""} integration`,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <div className={cn("rounded-xl border bg-surface transition-colors", selectedCount ? "border-ink" : "border-line", !available.length && "border-dashed")}>
      <div className="flex items-center gap-3 p-4">
        <input
          type="checkbox"
          aria-label={`Select all ${category.name} checks`}
          className="size-4 cursor-pointer accent-ink disabled:cursor-not-allowed"
          checked={allSelected}
          disabled={!optional.length}
          ref={(el) => {
            if (el) el.indeterminate = selectedCount > 0 && !allSelected;
          }}
          onChange={(e) => onToggle(optional.map((c) => c.key), e.target.checked)}
        />
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", selectedCount ? "bg-brand text-ink" : "bg-canvas text-ink-700")}>
          <CategoryIcon icon={category.icon} className="size-4" />
        </span>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold">{category.name}</span>
            {allMandatory && <Badge tone="warning"><Lock className="size-3" /> Required</Badge>}
          </span>
          <span className="block truncate text-xs text-muted">{summary}</span>
        </button>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="grid size-8 place-items-center rounded-lg hover:bg-canvas" aria-label="Toggle checks">
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>
      {expanded && (
        <ul className="space-y-3 border-t border-line px-4 py-4">
          {category.checks.map((check) => (
            <li key={check.key} className="flex items-start justify-between gap-3">
              <Checkbox
                checked={check.available && (check.mandatory || selected.has(check.key))}
                disabled={!check.available || check.mandatory}
                onChange={(e) => onToggle([check.key], e.target.checked)}
                label={check.name}
                description={check.available ? check.description : check.unavailableReason}
                className={cn(check.mandatory && "cursor-default opacity-100")}
              />
              <span className="flex shrink-0 items-center gap-1.5">
                {check.mandatory && <Badge tone="warning">Required</Badge>}
                {!check.available && <Badge>Needs integration</Badge>}
                <SeverityBadge severity={check.severity} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
