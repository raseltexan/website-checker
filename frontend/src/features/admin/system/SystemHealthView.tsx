"use client";

import type { ReactNode } from "react";
import { Cpu, Database, Mail, MonitorSmartphone, RefreshCw, ScanSearch, Server } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QueryState } from "@/components/ui/States";
import { useGetSystemHealthQuery } from "@/services/adminApi";
import { formatDateTime, formatDuration } from "@/utils/format";

const STATUS: Record<string, { tone: Tone; label: string }> = {
  up: { tone: "success", label: "Operational" },
  down: { tone: "danger", label: "Down" },
  not_configured: { tone: "neutral", label: "Not configured" },
};

function ServiceCard({ icon, name, status, detail }: { icon: ReactNode; name: string; status: string; detail: ReactNode }) {
  const s = STATUS[status] ?? STATUS.down;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-brand-100 [&>svg]:size-5">{icon}</span>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <p className="mt-4 font-bold">{name}</p>
      <p className="mt-0.5 text-sm break-words text-muted">{detail}</p>
    </Card>
  );
}

export function SystemHealthView() {
  const { data, isLoading, isFetching, error, refetch } = useGetSystemHealthQuery(undefined, { pollingInterval: 15_000, skipPollingIfUnfocused: true });
  const s = data?.services;
  const r = data?.runtime;

  return (
    <>
      <PageHeader
        eyebrow="Admin · Monitoring"
        title="System Health"
        description={data ? `Last checked ${formatDateTime(data.checkedAt)} · auto-refreshes every 15s` : "Live status of platform services."}
        actions={<Button variant="outline" icon={<RefreshCw className="size-4" />} loading={isFetching} onClick={refetch}>Refresh</Button>}
      />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {s && r && (
          <>
            <div className={`mb-6 rounded-card px-5 py-4 font-bold ${data.status === "healthy" ? "bg-ink text-brand" : "bg-red-600 text-white"}`}>
              {data.status === "healthy" ? "All core systems operational" : "Degraded — one or more core services are down"}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ServiceCard icon={<Server />} name="API server" status={s.api.status} detail={`Uptime ${formatDuration(s.api.uptimeSeconds)}`} />
              <ServiceCard icon={<Database />} name="MongoDB" status={s.database.status} detail={s.database.latencyMs !== null ? `Ping ${s.database.latencyMs} ms` : s.database.error} />
              <ServiceCard icon={<ScanSearch />} name="Scan engine" status={s.scanner.status} detail={`${s.scanner.active}/${s.scanner.concurrency} running · ${s.scanner.pending} queued · ${s.scanner.checksRegistered} checks`} />
              <ServiceCard icon={<Mail />} name="SMTP" status={s.smtp.status} detail={s.smtp.error ?? (s.smtp.status === "up" ? "Connection verified" : "Set SMTP_HOST to enable email")} />
              <ServiceCard icon={<MonitorSmartphone />} name="Browser provider" status={s.browser.available ? "up" : "not_configured"} detail={s.browser.reason} />
            </div>
            <Card className="mt-6">
              <CardHeader title="Runtime" />
              <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
                <dl className="space-y-2 text-sm">
                  {[["Node.js", r.node], ["Environment", r.environment], ["Platform", r.platform], ["CPU cores", String(r.cpus)], ["Load average", r.loadAverage.map((n) => n.toFixed(2)).join(" / ")]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm"><span className="flex items-center gap-1.5 font-semibold"><Cpu className="size-4" /> Heap</span><span className="text-muted">{r.memory.heapUsedMb} / {r.memory.heapTotalMb} MB</span></div>
                    <ProgressBar value={(r.memory.heapUsedMb / Math.max(r.memory.heapTotalMb, 1)) * 100} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">System memory</span><span className="text-muted">{r.system.totalMb - r.system.freeMb} / {r.system.totalMb} MB</span></div>
                    <ProgressBar value={((r.system.totalMb - r.system.freeMb) / Math.max(r.system.totalMb, 1)) * 100} tone="dark" />
                  </div>
                  <p className="text-xs text-muted">Process RSS: {r.memory.rssMb} MB</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </QueryState>
    </>
  );
}
