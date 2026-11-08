"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useGetUnreadCountQuery } from "@/services/notificationsApi";

export function NotificationBell() {
  const { data: count = 0 } = useGetUnreadCountQuery(undefined, { pollingInterval: 30_000, skipPollingIfUnfocused: true });
  return (
    <Link href="/dashboard/notifications" className="relative grid size-9 place-items-center rounded-lg text-ink-900 hover:bg-black/5" aria-label={`Notifications (${count} unread)`}>
      <Bell className="size-[18px]" />
      {count > 0 && (
        <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-ink ring-2 ring-surface">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
