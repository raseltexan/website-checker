"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, QueryState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/services/notificationsApi";
import type { Notification } from "@/types/models";
import { NotificationItem } from "./NotificationItem";

export function NotificationsView() {
  const router = useRouter();
  const toast = useToast();
  const list = useListParams({ limit: 15 });
  const { data, isLoading, error, refetch } = useGetNotificationsQuery(list.params);
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation();
  const [remove] = useDeleteNotificationMutation();

  const open = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  const onMarkAll = async () => {
    const res = await markAll();
    if ("error" in res) toast.error(res.error);
    else toast.success("All caught up");
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Scan results, account alerts and announcements."
        actions={<Button variant="outline" icon={<CheckCheck className="size-4" />} loading={markAllState.isLoading} onClick={onMarkAll}>Mark all read</Button>}
      />
      <Card>
        <div className="border-b border-line px-5 py-4">
          <Tabs
            value={list.filters.unread ?? ""}
            onChange={(v) => list.setFilter("unread", v)}
            options={[{ value: "", label: "All" }, { value: "true", label: "Unread" }]}
          />
        </div>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data?.data.length ? (
            <>
              <ul className="divide-y divide-line">
                {data.data.map((n) => <NotificationItem key={n.id} notification={n} onOpen={open} onDelete={(x) => remove(x.id)} />)}
              </ul>
              <Pagination meta={data.meta} onPageChange={list.setPage} />
            </>
          ) : (
            <EmptyState icon={<Bell />} title="No notifications" description="You'll be notified here when scans finish." />
          )}
        </QueryState>
      </Card>
    </>
  );
}
