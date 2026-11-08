"use client";

import { useParams, useRouter } from "next/navigation";
import { Ban, FileText, RefreshCw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { useLiveScan } from "@/hooks/useLiveScan";
import { useToast } from "@/hooks/useToast";
import { useCancelScanMutation, useGetScanQuery, useRescanMutation } from "@/services/scansApi";
import { hostname } from "@/utils/format";
import { ScanDetailView } from "./ScanDetailView";

export function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { scan, active, isLoading, error, refetch } = useLiveScan(id, useGetScanQuery);
  const [cancelScan, cancelState] = useCancelScanMutation();
  const [rescan, rescanState] = useRescanMutation();

  const onCancel = async () => {
    const res = await cancelScan(id);
    if ("error" in res) toast.error(res.error);
    else toast.info("Scan cancelled");
  };

  const onRescan = async () => {
    const res = await rescan(id);
    if ("error" in res) return toast.error(res.error);
    toast.success("New scan started");
    router.push(`/dashboard/scans/${res.data.id}`);
  };

  return (
    <>
      <PageHeader eyebrow="Scan" title={scan ? hostname(scan.url) : "Scan details"} description="Live progress and detailed check results." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {scan && (
          <ScanDetailView
            scan={scan}
            actions={
              <>
                {active ? (
                  <Button variant="outline" icon={<Ban className="size-4" />} loading={cancelState.isLoading} onClick={onCancel}>
                    Cancel scan
                  </Button>
                ) : (
                  <Button variant="outline" icon={<RefreshCw className="size-4" />} loading={rescanState.isLoading} onClick={onRescan}>
                    Re-scan
                  </Button>
                )}
                {scan.report && (
                  <LinkButton href={`/dashboard/reports/${scan.report.id}`} variant="dark" icon={<FileText className="size-4" />}>
                    View report
                  </LinkButton>
                )}
              </>
            }
          />
        )}
      </QueryState>
    </>
  );
}
