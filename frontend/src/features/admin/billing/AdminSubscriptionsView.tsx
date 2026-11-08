"use client";

import { useState } from "react";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { QueryState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { PlanCard } from "@/features/billing/PlanCard";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useDeletePlanMutation, useGetAdminPlansQuery, useGetAdminSubscriptionsQuery } from "@/services/adminApi";
import type { Plan, SubscriptionStatus } from "@/types/models";
import { formatDate } from "@/utils/format";
import { PlanFormModal } from "./PlanFormModal";

const STATUS_TONE: Record<SubscriptionStatus, Tone> = { ACTIVE: "success", TRIALING: "info", PAST_DUE: "warning", CANCELLED: "neutral" };

function PlansSection() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetAdminPlansQuery();
  const [remove, { isLoading: deleting }] = useDeletePlanMutation();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Plan | null>(null);

  const open = (p: Plan | null) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const res = await remove(toDelete.id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Plan deleted");
    setToDelete(null);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Plans</h2>
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => open(null)}>New plan</Button>
      </div>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((p) => (
            <div key={p.id} className="space-y-2">
              <PlanCard plan={p} interval="monthly" />
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex flex-wrap gap-1">
                  <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Hidden"}</Badge>
                  {p.isDefault && <Badge tone="brand">Default</Badge>}
                  <Badge>{p.subscribers ?? 0} subscribers</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit plan" onClick={() => open(p)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Delete plan" onClick={() => setToDelete(p)}><Trash2 className="size-4 text-danger" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
      <PlanFormModal open={formOpen} onClose={() => setFormOpen(false)} plan={editing} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title={`Delete ${toDelete?.name ?? "plan"}?`} description="Plans with subscribers cannot be deleted — deactivate them instead." confirmLabel="Delete" />
    </section>
  );
}

export function AdminSubscriptionsView() {
  const list = useListParams();
  const { data, isLoading, error, refetch } = useGetAdminSubscriptionsQuery(list.params);
  return (
    <>
      <PageHeader eyebrow="Admin" title="Subscriptions & Plans" description="Configure pricing plans and review customer subscriptions." />
      <PlansSection />
      <Card className="mt-10">
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search customer…" />
          <Tabs value={list.filters.status ?? ""} onChange={(v) => list.setFilter("status", v)} options={[{ value: "", label: "All" }, { value: "ACTIVE", label: "Active" }, { value: "PAST_DUE", label: "Past due" }, { value: "CANCELLED", label: "Cancelled" }]} />
        </TableToolbar>
        <DataTable
          rows={data?.data}
          meta={data?.meta}
          onPageChange={list.setPage}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          rowKey={(s) => s.id}
          empty={{ icon: <CreditCard />, title: "No subscriptions found" }}
          columns={[
            { header: "Customer", cell: (s) => <span><span className="font-bold">{s.user?.name}</span><span className="block text-xs text-muted">{s.user?.email}</span></span> },
            { header: "Plan", cell: (s) => <span className="font-semibold">{s.plan.name}</span> },
            { header: "Status", cell: (s) => <Badge tone={STATUS_TONE[s.status]}>{s.cancelAtPeriodEnd ? "cancelling" : s.status.toLowerCase().replace("_", " ")}</Badge> },
            { header: "Interval", hideOnMobile: true, cell: (s) => <span className="capitalize">{s.interval}</span> },
            { header: "Renews", hideOnMobile: true, cell: (s) => <span className="text-xs text-muted">{formatDate(s.currentPeriodEnd)}</span> },
          ]}
        />
      </Card>
    </>
  );
}
