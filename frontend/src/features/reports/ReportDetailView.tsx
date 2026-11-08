"use client";

import { useParams } from "next/navigation";
import { useGetReportQuery } from "@/services/reportsApi";
import { ReportPreview } from "./ReportPreview";

export function ReportDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetReportQuery(id);
  return (
    <ReportPreview
      report={data}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      backHref="/dashboard/reports"
      scanHref={data ? `/dashboard/scans/${data.scanId}` : undefined}
    />
  );
}
