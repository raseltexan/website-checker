"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MailX, Send, SkipForward, XCircle } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, TableToolbar } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { QueryState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useGetEmailLogsQuery, useGetEmailOverviewQuery, useSendTestEmailMutation } from "@/services/adminApi";
import type { EmailStatus } from "@/types/models";
import { formatDateTime } from "@/utils/format";

const STATUS_TONE: Record<EmailStatus, Tone> = { SENT: "success", FAILED: "danger", SKIPPED: "neutral" };

function SmtpCard() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetEmailOverviewQuery();
  const [to, setTo] = useState("");
  const [sendTest, { isLoading: sending }] = useSendTestEmailMutation();

  const onTest = async () => {
    const res = await sendTest({ to });
    if ("error" in res) return toast.error(res.error);
    if (res.data.sent) toast.success("Test email sent");
    else toast.error("Email was not sent — see the log below");
  };

  const smtp = data?.smtp;
  const rows: [string, string][] = smtp
    ? [["Host", smtp.host ?? "Not configured"], ["Port", String(smtp.port)], ["TLS", smtp.secure ? "Yes" : "STARTTLS / none"], ["User", smtp.user ?? "—"], ["From", smtp.from]]
    : [];

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
      {data && smtp && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="SMTP status" value={smtp.reachable ? "Online" : smtp.configured ? "Unreachable" : "Not set"} icon={smtp.reachable ? <CheckCircle2 /> : <MailX />} highlight hint={smtp.error} />
            <StatCard label="Sent" value={data.stats.SENT ?? 0} icon={<Send />} />
            <StatCard label="Failed" value={data.stats.FAILED ?? 0} icon={<XCircle />} />
            <StatCard label="Skipped" value={data.stats.SKIPPED ?? 0} icon={<SkipForward />} hint="SMTP not configured at send time" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="SMTP configuration" description="Read from server environment variables." />
              <dl className="divide-y divide-line">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-sm">
                    <dt className="shrink-0 text-muted">{k}</dt>
                    <dd className="min-w-0 text-right font-semibold break-all">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card>
              <CardHeader title="Send a test email" description="Verify delivery end-to-end." />
              <CardBody className="flex flex-col gap-3 sm:flex-row">
                <Input type="email" placeholder="you@example.com" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Recipient" leftIcon={<Mail />} />
                <Button loading={sending} disabled={!to} onClick={onTest} icon={<Send className="size-4" />}>Send test</Button>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </QueryState>
  );
}

export function EmailMonitoringView() {
  const list = useListParams();
  const logs = useGetEmailLogsQuery(list.params);
  return (
    <>
      <PageHeader eyebrow="Admin · Monitoring" title="Email & SMTP Monitoring" description="Transactional email delivery status and logs." />
      <SmtpCard />
      <Card className="mt-6">
        <TableToolbar>
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search recipient or subject…" />
          <Tabs value={list.filters.status ?? ""} onChange={(v) => list.setFilter("status", v)} options={[{ value: "", label: "All" }, { value: "SENT", label: "Sent" }, { value: "FAILED", label: "Failed" }, { value: "SKIPPED", label: "Skipped" }]} />
        </TableToolbar>
        <DataTable
          rows={logs.data?.data}
          meta={logs.data?.meta}
          onPageChange={list.setPage}
          isLoading={logs.isLoading}
          error={logs.error}
          onRetry={logs.refetch}
          rowKey={(l) => l.id}
          empty={{ icon: <Mail />, title: "No emails logged yet" }}
          columns={[
            { header: "Recipient", cell: (l) => <span className="font-semibold">{l.to}</span> },
            { header: "Subject", cell: (l) => <span className="block max-w-72 truncate">{l.subject}</span> },
            { header: "Template", hideOnMobile: true, cell: (l) => <code className="text-xs">{l.template}</code> },
            { header: "Status", cell: (l) => <span title={l.error ?? undefined}><Badge tone={STATUS_TONE[l.status]}>{l.status.toLowerCase()}</Badge></span> },
            { header: "Sent at", hideOnMobile: true, cell: (l) => <span className="text-xs text-muted">{formatDateTime(l.createdAt)}</span> },
          ]}
        />
      </Card>
    </>
  );
}
