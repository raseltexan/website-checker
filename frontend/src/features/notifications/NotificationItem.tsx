import { AlertTriangle, CheckCircle2, Info, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Notification } from "@/types/models";
import { timeAgo } from "@/utils/format";

const ICONS = {
  INFO: { icon: Info, cls: "bg-blue-50 text-info" },
  SUCCESS: { icon: CheckCircle2, cls: "bg-green-50 text-success" },
  WARNING: { icon: AlertTriangle, cls: "bg-amber-50 text-warning" },
  ERROR: { icon: XCircle, cls: "bg-red-50 text-danger" },
};

interface NotificationItemProps {
  notification: Notification;
  onOpen?: (n: Notification) => void;
  onDelete?: (n: Notification) => void;
  meta?: string;
}

export function NotificationItem({ notification: n, onOpen, onDelete, meta }: NotificationItemProps) {
  const { icon: Icon, cls } = ICONS[n.type];
  return (
    <li className={cn("group flex items-start gap-3 px-5 py-4", !n.read && "bg-brand-50")}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", cls)}>
        <Icon className="size-4" />
      </span>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen?.(n)} disabled={!onOpen}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold">{n.title}</p>
          {!n.read && <span className="size-2 rounded-full bg-brand-600" aria-label="Unread" />}
        </div>
        <p className="mt-0.5 text-sm text-muted">{n.message}</p>
        <p className="mt-1 text-xs text-muted">{meta ? `${meta} · ` : ""}{timeAgo(n.createdAt)}</p>
      </button>
      {onDelete && (
        <button onClick={() => onDelete(n)} className="rounded-lg p-2 text-muted opacity-100 hover:bg-black/5 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete notification">
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}
