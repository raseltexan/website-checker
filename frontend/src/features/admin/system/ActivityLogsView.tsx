"use client";

import { Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { LevelBadge, humanizeAction } from "@/features/activity/ActivityList";
import { useListParams } from "@/hooks/useListParams";
import { useGetActivityLogsQuery } from "@/services/adminApi";
import { formatDateTime } from "@/utils/format";

export function ActivityLogsView() {
  const list = useListParams({ limit: 20 });
  const { data, isLoading, error, refetch } = useGetActivityLogsQuery(list.params);
  return (
    <>
      <PageHeader eyebrow="Admin · Monitoring" title="Activity Logs" description="Audit trail of authentication events and changes across the platform." />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search action, entity or IP…" />
          <Tabs value={list.filters.level ?? ""} onChange={(v) => list.setFilter("level", v)} options={[{ value: "", label: "All" }, { value: "INFO", label: "Info" }, { value: "WARNING", label: "Warning" }, { value: "SECURITY", label: "Security" }]} />
        </TableToolbar>
        <DataTable
          rows={data?.data}
          meta={data?.meta}
          onPageChange={list.setPage}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          rowKey={(l) => l.id}
          empty={{ icon: <Activity />, title: "No activity recorded" }}
          columns={[
            { header: "Event", cell: (l) => <span><span className="font-bold">{humanizeAction(l.action)}</span><code className="block text-[11px] text-muted">{l.action}</code></span> },
            { header: "Actor", cell: (l) => <span className="text-xs">{l.user?.email ?? "System / anonymous"}</span> },
            { header: "Level", cell: (l) => <LevelBadge level={l.level} /> },
            { header: "Target", hideOnMobile: true, cell: (l) => <span className="text-xs text-muted">{l.entity ? `${l.entity}${l.entityId ? ` · ${l.entityId.slice(-8)}` : ""}` : "—"}</span> },
            { header: "IP", hideOnMobile: true, cell: (l) => <code className="text-xs">{l.ipAddress ?? "—"}</code> },
            { header: "When", cell: (l) => <span className="text-xs whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</span> },
          ]}
        />
      </Card>
    </>
  );
}
