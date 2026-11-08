import { cn } from "@/lib/cn";
import { scoreTone } from "@/utils/format";

const strokes = { success: "#16a34a", warning: "#d97706", danger: "#dc2626", neutral: "#a3a3a3" };

interface ScoreRingProps {
  score?: number | null;
  size?: number;
  label?: string;
  className?: string;
}

/** Circular 0–100 score gauge. */
export function ScoreRing({ score, size = 120, label = "Score", className }: ScoreRingProps) {
  const stroke = Math.max(6, size / 12);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-black/[0.07]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokes[scoreTone(score)]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-extrabold leading-none tracking-tight" style={{ fontSize: size / 3.6 }}>
          {score ?? "–"}
        </p>
        {size >= 90 && <p className="mt-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>}
      </div>
    </div>
  );
}

export function ScorePill({ score }: { score?: number | null }) {
  const tone = scoreTone(score);
  const cls = { success: "bg-green-50 text-green-700", warning: "bg-amber-50 text-amber-700", danger: "bg-red-50 text-red-700", neutral: "bg-black/5 text-muted" }[tone];
  return <span className={cn("inline-flex min-w-10 justify-center rounded-md px-2 py-0.5 text-xs font-extrabold", cls)}>{score ?? "—"}</span>;
}
