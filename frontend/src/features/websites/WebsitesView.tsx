"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Pencil, Plus, ScanSearch, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScorePill } from "@/components/ui/ScoreRing";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useDeleteWebsiteMutation, useGetWebsitesQuery } from "@/services/websitesApi";
import type { Website } from "@/types/models";
import { timeAgo } from "@/utils/format";
import { WebsiteFormModal } from "./WebsiteFormModal";

export function WebsitesView() {
  const list = useListParams();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetWebsitesQuery(list.params);
  const [deleteWebsite, { isLoading: deleting }] = useDeleteWebsiteMutation();
  const [editing, setEditing] = useState<Website | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Website | null>(null);

  const openForm = (w: Website | null) => {
    setEditing(w);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const res = await deleteWebsite(toDelete.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Website deleted");
    setToDelete(null);
  };

  return (
    <>
      <PageHeader title="Websites" description="Manage the sites you monitor and launch scans for them." actions={<Button icon={<Plus className="size-4" />} onClick={() => openForm(null)}>Add website</Button>} />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search websites…" />
        </TableToolbar>
        <DataTable
          rows={data?.data}
          meta={data?.meta}
          onPageChange={list.setPage}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          rowKey={(w) => w.id}
          empty={{ icon: <Globe />, title: "No websites yet", description: "Add a website or run a scan — sites are added automatically.", action: <Button size="sm" onClick={() => openForm(null)}>Add website</Button> }}
          columns={[
            {
              header: "Website",
              cell: (w) => (
                <Link href={`/dashboard/websites/${w.id}`} className="block">
                  <p className="font-bold hover:underline">{w.name}</p>
                  <p className="max-w-64 truncate text-xs text-muted">{w.url}</p>
                </Link>
              ),
            },
            { header: "Tags", hideOnMobile: true, cell: (w) => <div className="flex flex-wrap gap-1">{w.tags.length ? w.tags.map((t) => <Badge key={t}>{t}</Badge>) : <span className="text-muted">—</span>}</div> },
            { header: "Last score", cell: (w) => <ScorePill score={w.lastScore} /> },
            { header: "Scans", hideOnMobile: true, cell: (w) => <span className="font-semibold">{w._count?.scans ?? 0}</span> },
            { header: "Last scan", hideOnMobile: true, cell: (w) => <span className="text-xs text-muted">{timeAgo(w.lastScanAt)}</span> },
            {
              header: "Actions",
              className: "text-right",
              cell: (w) => (
                <div className="flex justify-end gap-1">
                  <LinkButton href={`/dashboard/checker?url=${encodeURIComponent(w.url)}&websiteId=${w.id}`} variant="ghost" size="icon" aria-label="Scan now"><ScanSearch className="size-4" /></LinkButton>
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openForm(w)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(w)}><Trash2 className="size-4 text-danger" /></Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
      <WebsiteFormModal open={formOpen} onClose={() => setFormOpen(false)} website={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={`Delete ${toDelete?.name ?? "website"}?`}
        description="Scans and reports are kept, but will no longer be grouped under this website."
        confirmLabel="Delete"
      />
    </>
  );
}
