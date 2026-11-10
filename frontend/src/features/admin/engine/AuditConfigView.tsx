"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { useToast } from "@/hooks/useToast";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/services/adminApi";
import type { AuditSettings } from "@/types/models";

const int = (min: number, max: number) => z.number({ error: "Required" }).int().min(min, `Min ${min}`).max(max, `Max ${max}`);
const schema = z.object({
  requestTimeoutMs: int(2000, 60000),
  maxLinksToCheck: int(0, 200),
  maxPagesToCrawl: int(1, 50),
  maxRedirects: int(0, 20),
  slowTtfbMs: int(100, 10000),
  maxPageSizeKb: int(100, 20000),
  sslExpiryWarningDays: int(1, 120),
});

const FIELDS: { name: keyof AuditSettings; label: string; hint: string }[] = [
  { name: "requestTimeoutMs", label: "Request timeout (ms)", hint: "Abort network requests after this long." },
  { name: "maxRedirects", label: "Max redirects", hint: "Redirect hops followed before failing." },
  { name: "maxLinksToCheck", label: "Links to check per scan", hint: "Broken-link check sample size. 0 disables probing." },
  { name: "maxPagesToCrawl", label: "Pages to crawl per scan", hint: "Internal pages analysed by the layout & spacing checks." },
  { name: "slowTtfbMs", label: "Slow response threshold (ms)", hint: "Warn above this; fail above double." },
  { name: "maxPageSizeKb", label: "Max HTML size (KB)", hint: "Fail when the HTML document exceeds this." },
  { name: "sslExpiryWarningDays", label: "SSL expiry warning (days)", hint: "Warn when the certificate expires sooner." },
];

export function AuditConfigView() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetSettingsQuery();
  const [update, { isLoading: saving }] = useUpdateSettingsMutation();
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<AuditSettings>({ resolver: zodResolver(schema), values: data?.audit });

  const onSubmit = async (value: AuditSettings) => {
    const res = await update({ key: "audit", value });
    if ("error" in res) toast.error(res.error);
    else toast.success("Audit configuration saved");
  };

  return (
    <>
      <PageHeader eyebrow="Admin · Audit Engine" title="Audit Configuration" description="Thresholds and limits used by the scanning engine." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <Card>
          <CardHeader title="Scanner thresholds" description="Applied to scans started after saving." />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 sm:grid-cols-2" noValidate>
              {FIELDS.map((f) => (
                <FormField key={f.name} label={f.label} htmlFor={f.name} hint={f.hint} error={errors[f.name]?.message}>
                  <Input id={f.name} type="number" aria-invalid={!!errors[f.name]} {...register(f.name, { valueAsNumber: true })} />
                </FormField>
              ))}
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" loading={saving} disabled={!isDirty}>Save configuration</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </QueryState>
    </>
  );
}
