"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { ReportsTable } from "@/features/reports/ReportsTable";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { ADMIN_BASE } from "@/lib/navigation";
import { useDeleteAdminReportMutation, useGetAdminReportsQuery } from "@/services/adminApi";
import type { Report } from "@/types/models";

export function AdminReportsView() {
  const list = useListParams();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetAdminReportsQuery(list.params);
  const [remove, { isLoading: deleting }] = useDeleteAdminReportMutation();
  const [target, setTarget] = useState<Report | null>(null);

  const onDelete = async () => {
    if (!target) return;
    const res = await remove(target.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Report deleted");
    setTarget(null);
  };

  return (
    <>
      <PageHeader eyebrow="Admin" title="Reports Management" description="Every audit report generated on the platform." />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search title or URL…" />
        </TableToolbar>
        <ReportsTable
          rows={data?.data}
          meta={data?.meta}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onPageChange={list.setPage}
          showUser
          href={(r) => `${ADMIN_BASE}/reports/${r.id}`}
          actions={(r) => (
            <>
              <LinkButton href={`${ADMIN_BASE}/reports/${r.id}`} variant="ghost" size="icon" aria-label="View"><Eye className="size-4" /></LinkButton>
              <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setTarget(r)}><Trash2 className="size-4 text-danger" /></Button>
            </>
          )}
        />
      </Card>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} onConfirm={onDelete} loading={deleting} title="Delete report?" description="The report is removed for its owner. The scan is kept." confirmLabel="Delete" />
    </>
  );
}
