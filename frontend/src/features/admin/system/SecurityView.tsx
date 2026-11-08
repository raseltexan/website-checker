"use client";

import Link from "next/link";
import { KeyRound, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, QueryState } from "@/components/ui/States";
import { ActivityList } from "@/features/activity/ActivityList";
import { useToast } from "@/hooks/useToast";
import { ADMIN_BASE } from "@/lib/navigation";
import { useGetSecurityOverviewQuery, useRevokeAnySessionMutation } from "@/services/adminApi";
import { describeUserAgent, formatDate, timeAgo } from "@/utils/format";

export function SecurityView() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetSecurityOverviewQuery(undefined, { pollingInterval: 30_000, skipPollingIfUnfocused: true });
  const [revoke, { isLoading: revoking, originalArgs }] = useRevokeAnySessionMutation();

  const onRevoke = async (id: string) => {
    const res = await revoke(id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Session revoked");
  };

  return (
    <>
      <PageHeader eyebrow="Admin · Monitoring" title="Security Monitoring" description="Failed sign-ins, security events, active sessions and suspended accounts." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard label="Failed logins (24h)" value={data.stats.failedLogins24h} icon={<KeyRound />} highlight />
              <StatCard label="Security events (24h)" value={data.stats.securityEvents24h} icon={<ShieldAlert />} />
              <StatCard label="Active sessions" value={data.stats.activeSessions} icon={<ShieldCheck />} />
              <StatCard label="Suspended users" value={data.stats.bannedUsers} icon={<UserX />} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader title="Recent security events" />
                {data.recentEvents.length ? <ActivityList logs={data.recentEvents} showUser /> : <EmptyState icon={<ShieldCheck />} title="No security events" />}
              </Card>
              <Card>
                <CardHeader title="Suspended accounts" />
                {data.bannedUsers.length ? (
                  <ul className="divide-y divide-line">
                    {data.bannedUsers.map((u) => (
                      <li key={u.id}>
                        <Link href={`${ADMIN_BASE}/users/${u.id}`} className="block px-5 py-3 hover:bg-canvas/60">
                          <p className="text-sm font-bold">{u.name} <span className="font-normal text-muted">· {u.email}</span></p>
                          <p className="text-xs text-muted">{u.banReason ?? "No reason given"} · {u.banExpires ? `until ${formatDate(u.banExpires)}` : "indefinite"}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={<UserX />} title="No suspended accounts" />
                )}
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader title="Active sessions" description="Most recent 25 sessions across all users." />
              <DataTable
                rows={data.sessions}
                rowKey={(s) => s.id}
                columns={[
                  { header: "User", cell: (s) => <span><span className="font-bold">{s.user?.name}</span><span className="block text-xs text-muted">{s.user?.email}</span></span> },
                  { header: "Device", hideOnMobile: true, cell: (s) => <span className="text-sm">{describeUserAgent(s.userAgent)}</span> },
                  { header: "IP", hideOnMobile: true, cell: (s) => <code className="text-xs">{s.ipAddress ?? "—"}</code> },
                  { header: "Signed in", cell: (s) => <span className="text-xs text-muted">{timeAgo(s.createdAt)}</span> },
                  { header: "", className: "text-right", cell: (s) => <Button variant="outline" size="sm" loading={revoking && originalArgs === s.id} onClick={() => onRevoke(s.id)}>Revoke</Button> },
                ]}
              />
            </Card>
          </>
        )}
      </QueryState>
    </>
  );
}
