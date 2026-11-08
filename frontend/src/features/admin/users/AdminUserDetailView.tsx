"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Monitor } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, QueryState } from "@/components/ui/States";
import { ActivityList } from "@/features/activity/ActivityList";
import { ADMIN_BASE } from "@/lib/navigation";
import { useGetAdminUserQuery } from "@/services/adminApi";
import { describeUserAgent, formatDate, timeAgo } from "@/utils/format";
import { UserAccountCard } from "./UserAccountCard";

export function AdminUserDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, error, refetch } = useGetAdminUserQuery(id);

  return (
    <>
      <LinkButton href={`${ADMIN_BASE}/users`} variant="ghost" icon={<ArrowLeft className="size-4" />} className="mb-4">All users</LinkButton>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {user && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              <Card className="p-6 text-center">
                <Avatar name={user.name} image={user.image} className="mx-auto size-20 text-xl" />
                <p className="mt-4 text-lg font-extrabold">{user.name}</p>
                <p className="text-sm break-all text-muted">{user.email}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Badge tone={user.role === "admin" ? "dark" : "neutral"}>{user.role ?? "user"}</Badge>
                  <Badge tone={user.banned ? "danger" : "success"}>{user.banned ? "Suspended" : "Active"}</Badge>
                  <Badge tone={user.emailVerified ? "success" : "warning"}>{user.emailVerified ? "Verified" : "Unverified"}</Badge>
                </div>
                {user.banned && user.banReason && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{user.banReason}</p>}
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                  {[["Websites", user._count.websites], ["Scans", user._count.scans], ["Reports", user._count.reports]].map(([label, value]) => (
                    <div key={label}>
                      <dd className="text-xl font-extrabold">{value}</dd>
                      <dt className="text-xs text-muted">{label}</dt>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs text-muted">
                  Joined {formatDate(user.createdAt)}
                  {user.company && ` · ${user.company}`}
                </p>
              </Card>
              <UserAccountCard user={user} />
            </div>
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader title="Sessions" description="Most recent sign-ins" />
                {user.sessions.length ? (
                  <ul className="divide-y divide-line">
                    {user.sessions.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                        <Monitor className="size-4 text-muted" />
                        <span className="flex-1 text-sm font-semibold">{describeUserAgent(s.userAgent)}</span>
                        <span className="text-xs text-muted">{s.ipAddress ?? "—"} · {timeAgo(s.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No sessions" />
                )}
              </Card>
              <Card>
                <CardHeader title="Recent activity" />
                {user.activityLogs.length ? <ActivityList logs={user.activityLogs} /> : <EmptyState title="No activity yet" />}
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
