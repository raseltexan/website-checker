"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Ban, FileText } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { ScanDetailView } from "@/features/scans/ScanDetailView";
import { useLiveScan } from "@/hooks/useLiveScan";
import { useToast } from "@/hooks/useToast";
import { ADMIN_BASE } from "@/lib/navigation";
import { useCancelAdminScanMutation, useGetAdminScanQuery } from "@/services/adminApi";
import { hostname } from "@/utils/format";

export function AdminScanDetailView() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { scan, active, isLoading, error, refetch } = useLiveScan(id, useGetAdminScanQuery);
  const [cancel, cancelState] = useCancelAdminScanMutation();

  const onCancel = async () => {
    const res = await cancel(id);
    if ("error" in res) toast.error(res.error);
    else toast.info("Scan cancelled");
  };

  return (
    <>
      <LinkButton href={`${ADMIN_BASE}/scans`} variant="ghost" icon={<ArrowLeft className="size-4" />} className="mb-4">All scans</LinkButton>
      <PageHeader eyebrow="Admin · Scan" title={scan ? hostname(scan.url) : "Scan"} />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {scan && (
          <ScanDetailView
            scan={scan}
            actions={
              <>
                {active && <Button variant="outline" icon={<Ban className="size-4" />} loading={cancelState.isLoading} onClick={onCancel}>Cancel scan</Button>}
                {scan.report && <LinkButton href={`${ADMIN_BASE}/reports/${scan.report.id}`} variant="dark" icon={<FileText className="size-4" />}>View report</LinkButton>}
              </>
            }
          />
        )}
      </QueryState>
    </>
  );
}
