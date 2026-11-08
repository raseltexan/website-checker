"use client";

import { Eye, ScanSearch, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useDeleteScanMutation, useGetScansQuery } from "@/services/scansApi";
import type { Scan } from "@/types/models";
import { ScansTable } from "./ScansTable";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ScanHistoryView() {
  const list = useListParams();
  const toast = useToast();
  const { data, isLoading, isFetching, error, refetch } = useGetScansQuery(list.params, { pollingInterval: 10_000, skipPollingIfUnfocused: true });
  const [deleteScan, { isLoading: deleting }] = useDeleteScanMutation();
  const [target, setTarget] = useState<Scan | null>(null);

  const confirmDelete = async () => {
    if (!target) return;
    const res = await deleteScan(target.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Scan deleted");
    setTarget(null);
  };

  return (
    <>
      <PageHeader title="Scan History" description="Every audit you've run, with live progress for active scans." actions={<LinkButton href="/dashboard/checker" icon={<ScanSearch className="size-4" />}>New scan</LinkButton>} />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search by URL…" />
          <Tabs value={list.filters.status ?? ""} onChange={(v) => list.setFilter("status", v)} options={STATUS_TABS} />
        </TableToolbar>
        <ScansTable
          rows={data?.data}
          meta={data?.meta}
          isLoading={isLoading || (isFetching && !data)}
          error={error}
          onRetry={refetch}
          onPageChange={list.setPage}
          detailHref={(s) => `/dashboard/scans/${s.id}`}
          emptyAction={<LinkButton href="/dashboard/checker" size="sm">Run your first scan</LinkButton>}
          actions={(s) => (
            <>
              <LinkButton href={`/dashboard/scans/${s.id}`} variant="ghost" size="icon" aria-label="View scan"><Eye className="size-4" /></LinkButton>
              <Button variant="ghost" size="icon" aria-label="Delete scan" disabled={s.status === "RUNNING"} onClick={() => setTarget(s)}><Trash2 className="size-4 text-danger" /></Button>
            </>
          )}
        />
      </Card>
      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete scan?"
        description="This permanently deletes the scan, its results and its report."
        confirmLabel="Delete"
      />
    </>
  );
}
