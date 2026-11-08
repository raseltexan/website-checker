"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useDeleteReportMutation, useGetReportsQuery } from "@/services/reportsApi";
import type { Report } from "@/types/models";
import { ReportsTable } from "./ReportsTable";

export function ReportsView() {
  const list = useListParams();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetReportsQuery(list.params);
  const [deleteReport, { isLoading: deleting }] = useDeleteReportMutation();
  const [target, setTarget] = useState<Report | null>(null);

  const confirmDelete = async () => {
    if (!target) return;
    const res = await deleteReport(target.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Report deleted");
    setTarget(null);
  };

  return (
    <>
      <PageHeader title="Audit Reports" description="Shareable reports generated from completed scans. Open one to preview or export as PDF." />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search reports…" />
        </TableToolbar>
        <ReportsTable
          rows={data?.data}
          meta={data?.meta}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onPageChange={list.setPage}
          href={(r) => `/dashboard/reports/${r.id}`}
          actions={(r) => (
            <>
              <LinkButton href={`/dashboard/reports/${r.id}`} variant="ghost" size="icon" aria-label="View report"><Eye className="size-4" /></LinkButton>
              <Button variant="ghost" size="icon" aria-label="Delete report" onClick={() => setTarget(r)}><Trash2 className="size-4 text-danger" /></Button>
            </>
          )}
        />
      </Card>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} onConfirm={confirmDelete} loading={deleting} title="Delete report?" description="The underlying scan is kept; only the report is removed." confirmLabel="Delete" />
    </>
  );
}
