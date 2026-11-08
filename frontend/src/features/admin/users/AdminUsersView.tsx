"use client";

import Link from "next/link";
import { Eye, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { useListParams } from "@/hooks/useListParams";
import { ADMIN_BASE } from "@/lib/navigation";
import { useGetAdminUsersQuery } from "@/services/adminApi";
import { formatDate } from "@/utils/format";

export function AdminUsersView() {
  const list = useListParams();
  const { data, isLoading, error, refetch } = useGetAdminUsersQuery(list.params);

  return (
    <>
      <PageHeader eyebrow="Admin" title="User Management" description="Search, review and manage every account on the platform." />
      <Card>
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name, email, company…" />
          <div className="flex gap-2">
            <Select aria-label="Filter by role" value={list.filters.role ?? ""} onChange={(e) => list.setFilter("role", e.target.value)} className="w-36">
              <option value="">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </Select>
            <Select aria-label="Filter by status" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)} className="w-36">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="banned">Suspended</option>
            </Select>
          </div>
        </TableToolbar>
        <DataTable
          rows={data?.data}
          meta={data?.meta}
          onPageChange={list.setPage}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          rowKey={(u) => u.id}
          empty={{ icon: <Users />, title: "No users found" }}
          columns={[
            {
              header: "User",
              cell: (u) => (
                <Link href={`${ADMIN_BASE}/users/${u.id}`} className="flex items-center gap-3">
                  <Avatar name={u.name} image={u.image} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold hover:underline">{u.name}</span>
                    <span className="block truncate text-xs text-muted">{u.email}</span>
                  </span>
                </Link>
              ),
            },
            { header: "Role", cell: (u) => <Badge tone={u.role === "admin" ? "dark" : "neutral"}>{u.role ?? "user"}</Badge> },
            { header: "Status", cell: (u) => <Badge tone={u.banned ? "danger" : "success"}>{u.banned ? "Suspended" : "Active"}</Badge> },
            { header: "Plan", hideOnMobile: true, cell: (u) => <span className="text-sm font-semibold">{u.subscription?.plan.name ?? "—"}</span> },
            { header: "Sites / Scans", hideOnMobile: true, cell: (u) => <span className="text-sm">{u._count.websites} / {u._count.scans}</span> },
            { header: "Joined", hideOnMobile: true, cell: (u) => <span className="text-xs text-muted">{formatDate(u.createdAt)}</span> },
            { header: "", className: "text-right", cell: (u) => <LinkButton href={`${ADMIN_BASE}/users/${u.id}`} variant="ghost" size="icon" aria-label="View user"><Eye className="size-4" /></LinkButton> },
          ]}
        />
      </Card>
    </>
  );
}
