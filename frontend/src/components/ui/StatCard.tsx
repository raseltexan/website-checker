import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { Skeleton } from "./Spinner";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: ReactNode;
  highlight?: boolean;
  loading?: boolean;
}

export function StatCard({ label, value, icon, hint, highlight, loading }: StatCardProps) {
  return (
    <Card className={cn("p-4 sm:p-5", highlight && "border-ink bg-ink text-white")}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <p className={cn("min-w-0 text-sm font-semibold", highlight ? "text-white/70" : "text-muted")}>{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg sm:size-9 [&>svg]:size-4", highlight ? "bg-brand text-ink" : "bg-brand-100 text-ink")}>{icon}</span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-2 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>}
      {hint && <p className={cn("mt-1 text-xs", highlight ? "text-white/60" : "text-muted")}>{hint}</p>}
    </Card>
  );
}
