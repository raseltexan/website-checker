import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Plan } from "@/types/models";
import { formatLimit, formatPrice } from "@/utils/format";

interface PlanCardProps {
  plan: Plan;
  interval: "monthly" | "yearly";
  current?: boolean;
  featured?: boolean;
  loading?: boolean;
  onSelect?: (plan: Plan) => void;
}

export function PlanCard({ plan, interval, current, featured, loading, onSelect }: PlanCardProps) {
  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  return (
    <div className={cn("relative flex flex-col rounded-card border p-6", featured ? "border-ink bg-ink text-white" : "border-line bg-surface")}>
      {featured && <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-extrabold text-ink">Most popular</span>}
      <p className="text-lg font-extrabold">{plan.name}</p>
      <p className={cn("mt-1 min-h-10 text-sm", featured ? "text-white/60" : "text-muted")}>{plan.description}</p>
      <p className="mt-4">
        <span className="text-4xl font-extrabold tracking-tight">{formatPrice(price)}</span>
        {price > 0 && <span className={cn("text-sm", featured ? "text-white/60" : "text-muted")}>/{interval === "yearly" ? "yr" : "mo"}</span>}
      </p>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-brand-600" />{formatLimit(plan.scanLimit)} scans / month</li>
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-brand-600" />{formatLimit(plan.websiteLimit)} websites</li>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-brand-600" />{f}</li>
        ))}
      </ul>
      {onSelect && (
        <Button className="mt-6 w-full" variant={current ? "outline" : featured ? "primary" : "dark"} disabled={current} loading={loading} onClick={() => onSelect(plan)}>
          {current ? "Current plan" : "Choose plan"}
        </Button>
      )}
    </div>
  );
}
