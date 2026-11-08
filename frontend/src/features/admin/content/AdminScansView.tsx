"use client";

import { useState } from "react";
import { Ban, Clock, Eye, Loader2, Trash2, XCircle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ScansTable } from "@/features/scans/ScansTable";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { ADMIN_BASE } from "@/lib/navigation";
import { useCancelAdminScanMutation, useDeleteAdminScanMutation, useGetAdminScansQuery, useGetScanQueueStatsQuery } from "@/services/adminApi";
import type { Scan } from "@/types/models";

const TABS = ["", "QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"].map((v) => ({ value: v, label: v ? v.charAt(0) + v.slice(1).toLowerCase() : "All" }));

export function AdminScansView() {
  const list = useListParams();
  const toast = useToast();
  const poll = { pollingInterval: 10_000, skipPollingIfUnfocused: true };
  const { data, isLoading, error, refetch } = useGetAdminScansQuery(list.params, poll);
  const stats = useGetScanQueueStatsQuery(undefined, poll);
  const [cancel] = useCancelAdminScanMutation();
  const [remove, { isLoading: deleting }] = useDeleteAdminScanMutation();
  const [target, setTarget] = useState<Scan | null>(null);
  const q = stats.data;

  const onCancel = async (s: Scan) => {
    const res = await cancel(s.id);
    if ("error" in res) toast.error(res.error);
    else toast.info("Scan cancelled");
  };

  const onDelete = async () => {
    if (!target) return;
    const res = await remove(target.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Scan deleted");
    setTarget(null);
  };

  return (
    <>
      <PageHeader eyebrow="Admin" title="Scan Management" description="Monitor the scan queue and manage every scan on the platform." />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Running now" value={q ? `${q.queue.active}/${q.queue.concurrency}` : "—"} icon={<Loader2 />} hint="Active / max concurrency" highlight loading={stats.isLoading} />
        <StatCard label="Queued" value={q?.queue.pending ?? 0} icon={<Clock />} loading={stats.isLoading} />
        <StatCard label="Failed (all time)" value={q?.byStatus.FAILED ?? 0} icon={<XCircle />} loading={stats.isLoading} />
        <StatCard label="Cancelled" value={q?.byStatus.CANCELLED ?? 0} icon={<Ban />} loading={stats.isLoading} />
      </div>
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search by URL…" />
          <Tabs value={list.filters.status ?? ""} onChange={(v) => list.setFilter("status", v)} options={TABS} />
        </TableToolbar>
        <ScansTable
          rows={data?.data}
          meta={data?.meta}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onPageChange={list.setPage}
          showUser
          detailHref={(s) => `${ADMIN_BASE}/scans/${s.id}`}
          actions={(s) => (
            <>
              <LinkButton href={`${ADMIN_BASE}/scans/${s.id}`} variant="ghost" size="icon" aria-label="View"><Eye className="size-4" /></LinkButton>
              {(s.status === "QUEUED" || s.status === "RUNNING") && <Button variant="ghost" size="icon" aria-label="Cancel" onClick={() => onCancel(s)}><Ban className="size-4" /></Button>}
              <Button variant="ghost" size="icon" aria-label="Delete" disabled={s.status === "RUNNING"} onClick={() => setTarget(s)}><Trash2 className="size-4 text-danger" /></Button>
            </>
          )}
        />
      </Card>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} onConfirm={onDelete} loading={deleting} title="Delete scan?" description="The scan, its results and report are permanently removed." confirmLabel="Delete" />
    </>
  );
}
