"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const selectedCount = available.filter((c) => selected.has(c.key)).length;
  const allSelected = available.length > 0 && selectedCount === available.length;

  return (
    <div className={cn("rounded-xl border bg-surface transition-colors", selectedCount ? "border-ink" : "border-line")}>
      <div className="flex items-center gap-3 p-4">
        <input
          type="checkbox"
          aria-label={`Select all ${category.name} checks`}
          className="size-4 cursor-pointer accent-ink"
          checked={allSelected}
          disabled={!available.length}
          ref={(el) => {
            if (el) el.indeterminate = selectedCount > 0 && !allSelected;
          }}
          onChange={(e) => onToggle(available.map((c) => c.key), e.target.checked)}
        />
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", selectedCount ? "bg-brand text-ink" : "bg-canvas text-ink-700")}>
          <CategoryIcon icon={category.icon} className="size-4" />
        </span>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <p className="text-sm font-bold">{category.name}</p>
          <p className="truncate text-xs text-muted">
            {selectedCount}/{available.length} selected
            {available.length < category.checks.length && ` · ${category.checks.length - available.length} need integration`}
          </p>
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
                checked={selected.has(check.key)}
                disabled={!check.available}
                onChange={(e) => onToggle([check.key], e.target.checked)}
                label={check.name}
                description={check.available ? check.description : check.unavailableReason}
              />
              <SeverityBadge severity={check.severity} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
