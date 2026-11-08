"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { useToast } from "@/hooks/useToast";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/services/adminApi";
import type { GeneralSettings } from "@/types/models";

const schema = z.object({
  siteName: z.string().trim().min(1, "Required").max(80),
  supportEmail: z.union([z.email("Enter a valid email"), z.literal("")]),
  allowRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

const TOGGLES: { name: "allowRegistration" | "maintenanceMode"; label: string; description: string }[] = [
  { name: "allowRegistration", label: "Allow new registrations", description: "When off, only existing users can sign in." },
  { name: "maintenanceMode", label: "Maintenance mode", description: "Blocks the API for non-admin users until turned off." },
];

export function AdminSettingsView() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useGetSettingsQuery();
  const [update, { isLoading: saving }] = useUpdateSettingsMutation();
  const { register, control, handleSubmit, formState: { errors, isDirty } } = useForm<GeneralSettings>({ resolver: zodResolver(schema), values: data?.general });

  const onSubmit = async (value: GeneralSettings) => {
    const res = await update({ key: "general", value });
    if ("error" in res) toast.error(res.error);
    else toast.success("Settings saved");
  };

  return (
    <>
      <PageHeader eyebrow="Admin" title="Admin Settings" description="Platform-wide configuration." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <Card>
            <CardHeader title="General" />
            <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Platform name" htmlFor="s-name" error={errors.siteName?.message}>
                <Input id="s-name" aria-invalid={!!errors.siteName} {...register("siteName")} />
              </FormField>
              <FormField label="Support email" htmlFor="s-email" error={errors.supportEmail?.message}>
                <Input id="s-email" type="email" placeholder="support@example.com" aria-invalid={!!errors.supportEmail} {...register("supportEmail")} />
              </FormField>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Access" />
            <ul className="divide-y divide-line">
              {TOGGLES.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold">{t.label}</p>
                    <p className="text-xs text-muted">{t.description}</p>
                  </div>
                  <Controller name={t.name} control={control} render={({ field }) => <Switch label={t.label} checked={!!field.value} onChange={field.onChange} />} />
                </li>
              ))}
            </ul>
          </Card>
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={!isDirty}>Save settings</Button>
          </div>
        </form>
      </QueryState>
    </>
  );
}
