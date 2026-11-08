"use client";

import { useParams } from "next/navigation";
import { ReportPreview } from "@/features/reports/ReportPreview";
import { ADMIN_BASE } from "@/lib/navigation";
import { useGetAdminReportQuery } from "@/services/adminApi";

export function AdminReportDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetAdminReportQuery(id);
  return (
    <ReportPreview
      report={data}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      backHref={`${ADMIN_BASE}/reports`}
      scanHref={data ? `${ADMIN_BASE}/scans/${data.scanId}` : undefined}
    />
  );
}
