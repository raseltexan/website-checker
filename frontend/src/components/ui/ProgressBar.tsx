import { cn } from "@/lib/cn";

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "dark" }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-black/[0.07]", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone === "brand" ? "bg-brand" : "bg-ink")} style={{ width: `${pct}%` }} />
    </div>
  );
}
