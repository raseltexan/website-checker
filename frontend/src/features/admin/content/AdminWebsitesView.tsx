"use client";

import { useState } from "react";
import { ExternalLink, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScorePill } from "@/components/ui/ScoreRing";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useDeleteAdminWebsiteMutation, useGetAdminWebsitesQuery } from "@/services/adminApi";
import type { Website } from "@/types/models";
import { formatDate, timeAgo } from "@/utils/format";

export function AdminWebsitesView() {
  const list = useListParams();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetAdminWebsitesQuery(list.params);
  const [remove, { isLoading: deleting }] = useDeleteAdminWebsiteMutation();
  const [target, setTarget] = useState<Website | null>(null);

  const confirm = async () => {
    if (!target) return;
    const res = await remove(target.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Website deleted");
    setTarget(null);
  };

  return (
    <>
      <PageHeader eyebrow="Admin" title="Website Management" description="All websites registered by users." />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name, URL or domain…" />
        </TableToolbar>
        <DataTable
          rows={data?.data}
          meta={data?.meta}
          onPageChange={list.setPage}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          rowKey={(w) => w.id}
          empty={{ icon: <Globe />, title: "No websites found" }}
          columns={[
            {
              header: "Website",
              cell: (w) => (
                <div className="min-w-0">
                  <p className="font-bold">{w.name}</p>
                  <a href={w.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-64 items-center gap-1 truncate text-xs text-muted hover:underline">
                    {w.url} <ExternalLink className="size-3" />
                  </a>
                </div>
              ),
            },
            { header: "Owner", hideOnMobile: true, cell: (w) => <span className="text-xs">{w.user?.email}</span> },
            { header: "Last score", cell: (w) => <ScorePill score={w.lastScore} /> },
            { header: "Scans", hideOnMobile: true, cell: (w) => <span className="font-semibold">{w._count?.scans ?? 0}</span> },
            { header: "Last scan", hideOnMobile: true, cell: (w) => <span className="text-xs text-muted">{timeAgo(w.lastScanAt)}</span> },
            { header: "Added", hideOnMobile: true, cell: (w) => <span className="text-xs text-muted">{formatDate(w.createdAt)}</span> },
            { header: "", className: "text-right", cell: (w) => <Button variant="ghost" size="icon" aria-label="Delete website" onClick={() => setTarget(w)}><Trash2 className="size-4 text-danger" /></Button> },
          ]}
        />
      </Card>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} onConfirm={confirm} loading={deleting} title={`Delete ${target?.name ?? "website"}?`} description="The website is removed for its owner. Existing scans are kept." confirmLabel="Delete" />
    </>
  );
}
