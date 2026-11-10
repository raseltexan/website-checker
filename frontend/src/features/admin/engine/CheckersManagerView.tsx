"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Checkbox";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/lib/categoryIcons";
import { useGetAdminCheckersQuery, useUpdateCategoryMutation } from "@/services/adminApi";
import type { CheckerCategory } from "@/types/models";
import { CheckRow } from "./CheckRow";

function CategoryPanel({ category }: { category: CheckerCategory }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [update, { isLoading }] = useUpdateCategoryMutation();
  const enabled = category.checks.filter((c) => c.isEnabled).length;

  const toggle = async (isEnabled: boolean) => {
    const res = await update({ id: category.id, isEnabled });
    if ("error" in res) toast.error(res.error);
    else toast.success(`${category.name} ${isEnabled ? "enabled" : "disabled"}`);
  };

  return (
    <Card className={cn("overflow-hidden", !category.isEnabled && "opacity-70")}>
      <div className="flex items-center gap-3 px-5 py-4">
        <span className={cn("grid size-10 place-items-center rounded-lg", category.isEnabled ? "bg-brand text-ink" : "bg-canvas text-muted")}>
          <CategoryIcon icon={category.icon} className="size-5" />
        </span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <p className="font-bold">{category.name}</p>
          <p className="truncate text-xs text-muted">{category.description} · {enabled}/{category.checks.length} checks enabled</p>
        </button>
        <Switch
          label={`Enable ${category.name}`}
          checked={category.isEnabled}
          disabled={isLoading || category.checks.some((c) => c.mandatory)}
          onChange={toggle}
        />
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid size-8 place-items-center rounded-lg hover:bg-canvas" aria-label="Toggle checks">
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <ul className="divide-y divide-line border-t border-line">
          {category.checks.map((check) => <CheckRow key={check.id} check={check} disabled={!category.isEnabled} />)}
        </ul>
      )}
    </Card>
  );
}

export function CheckersManagerView() {
  const { data, isLoading, error, refetch } = useGetAdminCheckersQuery();
  return (
    <>
      <PageHeader
        eyebrow="Admin · Audit Engine"
        title="Checker Categories"
        description="Enable or disable categories and individual checks, and tune severity and scoring weight. Changes apply to new scans."
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <div className="space-y-3">{data?.map((c) => <CategoryPanel key={c.id} category={c} />)}</div>
      </QueryState>
    </>
  );
}
