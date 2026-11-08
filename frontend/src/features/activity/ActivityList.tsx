import { Activity, ShieldAlert } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { ActivityLog, LogLevel } from "@/types/models";
import { formatDateTime } from "@/utils/format";

const LEVEL_TONE: Record<LogLevel, Tone> = { INFO: "neutral", WARNING: "warning", SECURITY: "danger" };

/** "admin.user_banned" → "User banned" */
export const humanizeAction = (action: string) => {
  const last = action.split(".").pop() ?? action;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/_/g, " ");
};

export function LevelBadge({ level }: { level: LogLevel }) {
  return <Badge tone={LEVEL_TONE[level]}>{level.toLowerCase()}</Badge>;
}

export function ActivityList({ logs, showUser }: { logs: ActivityLog[]; showUser?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {logs.map((log) => {
        const Icon = log.level === "SECURITY" ? ShieldAlert : Activity;
        return (
          <li key={log.id} className="flex items-start gap-3 px-5 py-3">
            <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", log.level === "SECURITY" ? "bg-red-50 text-danger" : "bg-canvas text-ink-700")}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {humanizeAction(log.action)} <span className="font-mono text-xs font-normal text-muted">{log.action}</span>
              </p>
              <p className="text-xs text-muted">
                {showUser && (log.user?.email ?? "System")}
                {showUser && " · "}
                {formatDateTime(log.createdAt)}
                {log.ipAddress && ` · ${log.ipAddress}`}
              </p>
            </div>
            <LevelBadge level={log.level} />
          </li>
        );
      })}
    </ul>
  );
}
