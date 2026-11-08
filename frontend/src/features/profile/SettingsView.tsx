"use client";

import { Activity } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, QueryState } from "@/components/ui/States";
import { ActivityList } from "@/features/activity/ActivityList";
import { useListParams } from "@/hooks/useListParams";
import { useGetMyActivityQuery } from "@/services/userApi";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { DangerZoneCard } from "./DangerZoneCard";
import { SessionsCard } from "./SessionsCard";

function RecentActivityCard() {
  const list = useListParams({ limit: 8 });
  const { data, isLoading, error, refetch } = useGetMyActivityQuery(list.params);
  return (
    <Card>
      <CardHeader title="Account activity" description="Sign-ins and changes to your account." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {data?.data.length ? (
          <>
            <ActivityList logs={data.data} />
            <Pagination meta={data.meta} onPageChange={list.setPage} />
          </>
        ) : (
          <EmptyState icon={<Activity />} title="No activity yet" />
        )}
      </QueryState>
    </Card>
  );
}

export function SettingsView() {
  return (
    <>
      <PageHeader title="Settings" description="Security, sessions and account preferences." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ChangePasswordCard />
          <DangerZoneCard />
        </div>
        <div className="space-y-6">
          <SessionsCard />
          <RecentActivityCard />
        </div>
      </div>
    </>
  );
}
