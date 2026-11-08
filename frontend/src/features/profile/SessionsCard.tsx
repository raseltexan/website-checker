"use client";

import { Monitor } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { QueryState } from "@/components/ui/States";
import { useToast } from "@/hooks/useToast";
import { useGetMySessionsQuery, useRevokeMySessionMutation } from "@/services/userApi";
import { describeUserAgent, timeAgo } from "@/utils/format";

export function SessionsCard() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetMySessionsQuery();
  const [revoke, { isLoading: revoking, originalArgs }] = useRevokeMySessionMutation();

  const onRevoke = async (id: string) => {
    const res = await revoke(id);
    if ("error" in res) toast.error(res.error);
    else toast.success("Session signed out");
  };

  return (
    <Card>
      <CardHeader title="Active sessions" description="Devices currently signed in to your account." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <ul className="divide-y divide-line">
          {data?.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid size-9 place-items-center rounded-lg bg-canvas"><Monitor className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-bold">
                  {describeUserAgent(s.userAgent)} {s.current && <Badge tone="success">This device</Badge>}
                </p>
                <p className="text-xs text-muted">{s.ipAddress ?? "Unknown IP"} · signed in {timeAgo(s.createdAt)}</p>
              </div>
              {!s.current && (
                <Button variant="outline" size="sm" loading={revoking && originalArgs === s.id} onClick={() => onRevoke(s.id)}>
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </QueryState>
    </Card>
  );
}
