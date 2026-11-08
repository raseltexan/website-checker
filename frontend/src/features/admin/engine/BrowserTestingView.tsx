"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Monitor, Plus, Smartphone, Tablet, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { SeverityBadge } from "@/features/scans/StatusBadges";
import { useToast } from "@/hooks/useToast";
import { useGetBrowserTestingQuery, useUpdateSettingsMutation } from "@/services/adminApi";
import type { BrowserSettings } from "@/types/models";

const BROWSERS = ["chromium", "firefox", "webkit"];
const deviceIcon = (width: number) => (width < 600 ? Smartphone : width < 1100 ? Tablet : Monitor);

function BrowserConfigForm({ initial }: { initial: BrowserSettings }) {
  const toast = useToast();
  const [config, setConfig] = useState(initial);
  const [update, { isLoading }] = useUpdateSettingsMutation();
  const set = <K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]) => setConfig((c) => ({ ...c, [key]: value }));
  const setDevice = (i: number, patch: Partial<BrowserSettings["devices"][number]>) =>
    set("devices", config.devices.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const save = async () => {
    const res = await update({ key: "browser", value: config });
    if ("error" in res) toast.error(res.error);
    else toast.success("Browser configuration saved");
  };

  return (
    <Card>
      <CardHeader title="Provider & matrix" description="Browsers and viewports used once a provider is implemented." action={<Button loading={isLoading} onClick={save}>Save</Button>} />
      <CardBody className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Provider" htmlFor="b-provider">
            <Select id="b-provider" value={config.provider} onChange={(e) => set("provider", e.target.value as BrowserSettings["provider"])}>
              <option value="none">None</option>
              <option value="playwright">Playwright (self-hosted)</option>
              <option value="browserless">Browserless (remote)</option>
            </Select>
          </FormField>
          <FormField label="Endpoint" htmlFor="b-endpoint" hint="WebSocket/HTTP endpoint for remote providers.">
            <Input id="b-endpoint" placeholder="wss://chrome.browserless.io" value={config.endpoint} onChange={(e) => set("endpoint", e.target.value)} />
          </FormField>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Browsers</p>
          <div className="flex flex-wrap gap-5">
            {BROWSERS.map((b) => (
              <Checkbox
                key={b}
                label={b.charAt(0).toUpperCase() + b.slice(1)}
                checked={config.browsers.includes(b)}
                onChange={(e) => set("browsers", e.target.checked ? [...config.browsers, b] : config.browsers.filter((x) => x !== b))}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Devices</p>
            <Button variant="outline" size="sm" icon={<Plus className="size-3.5" />} onClick={() => set("devices", [...config.devices, { name: "Custom", width: 1280, height: 800 }])}>
              Add device
            </Button>
          </div>
          <ul className="space-y-2">
            {config.devices.map((d, i) => {
              const Icon = deviceIcon(d.width);
              return (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
                  <Icon className="mx-1 size-4 text-muted" />
                  <Input aria-label="Device name" value={d.name} onChange={(e) => setDevice(i, { name: e.target.value })} className="h-8 w-36 flex-1 text-xs" />
                  <Input aria-label="Width" type="number" value={d.width} onChange={(e) => setDevice(i, { width: Number(e.target.value) })} className="h-8 w-20 text-xs" />
                  <span className="text-xs text-muted">×</span>
                  <Input aria-label="Height" type="number" value={d.height} onChange={(e) => setDevice(i, { height: Number(e.target.value) })} className="h-8 w-20 text-xs" />
                  <Button variant="ghost" size="icon" aria-label="Remove device" onClick={() => set("devices", config.devices.filter((_, idx) => idx !== i))}>
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

export function BrowserTestingView() {
  const { data, isLoading, error, refetch } = useGetBrowserTestingQuery();
  return (
    <>
      <PageHeader eyebrow="Admin · Audit Engine" title="Browser & Device Testing" description="Real-browser rendering checks across browsers and screen sizes." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <div className="space-y-6">
            <div className={`flex items-start gap-3 rounded-card border p-4 ${data.status.available ? "border-green-200 bg-green-50" : "border-brand-600/30 bg-brand-50"}`}>
              {data.status.available ? <CheckCircle2 className="mt-0.5 size-5 text-success" /> : <AlertTriangle className="mt-0.5 size-5 text-brand-700" />}
              <div>
                <p className="font-bold">{data.status.available ? "Browser provider is available" : "Browser checks are currently unavailable"}</p>
                <p className="text-sm text-muted">
                  {data.status.reason}. These checks are reported as “Unavailable” in scans and excluded from scores — no simulated results are produced.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
              <BrowserConfigForm key={JSON.stringify(data.config)} initial={data.config} />
              <Card>
                <CardHeader title="Browser-dependent checks" />
                <ul className="divide-y divide-line">
                  {data.checks.map((c) => (
                    <li key={c.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">{c.name}</p>
                        <SeverityBadge severity={c.severity} />
                        <Badge tone={c.isEnabled ? "success" : "neutral"}>{c.isEnabled ? "Enabled" : "Disabled"}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{c.category.name} · {c.description}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
