"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { QueryState } from "@/components/ui/States";
import { useToast } from "@/hooks/useToast";
import { useCreateScanMutation, useGetCheckersQuery } from "@/services/scansApi";
import { CategoryChecklist } from "./CategoryChecklist";

const schema = z.object({
  url: z
    .string()
    .trim()
    .min(3, "Enter a website URL")
    .refine((v) => {
      try {
        const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
        return u.hostname.includes(".");
      } catch {
        return false;
      }
    }, "Enter a valid URL, e.g. example.com"),
});

interface CheckerFormProps {
  defaultUrl?: string;
  websiteId?: string;
}

export function CheckerForm({ defaultUrl = "", websiteId }: CheckerFormProps) {
  const router = useRouter();
  const toast = useToast();
  const catalog = useGetCheckersQuery();
  const [createScan, { isLoading }] = useCreateScanMutation();
  const [touched, setTouched] = useState<Set<string> | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { url: defaultUrl } });

  const { availableKeys, mandatoryKeys } = useMemo(() => {
    const checks = (catalog.data ?? []).flatMap((c) => c.checks.filter((k) => k.available));
    return { availableKeys: checks.map((k) => k.key), mandatoryKeys: checks.filter((k) => k.mandatory).map((k) => k.key) };
  }, [catalog.data]);
  // Until the user edits the selection, everything available is selected. Mandatory checks are always included.
  const selected = new Set([...(touched ?? availableKeys), ...mandatoryKeys]);

  const toggle = (keys: string[], checked: boolean) => {
    const next = new Set(selected);
    keys.forEach((k) => (checked ? next.add(k) : !mandatoryKeys.includes(k) && next.delete(k)));
    setTouched(next);
  };

  const onSubmit = async ({ url }: z.infer<typeof schema>) => {
    if (!selected.size) return toast.error("Select at least one check");
    const result = await createScan({ url, checks: [...selected], websiteId });
    if ("error" in result) return toast.error(result.error);
    toast.success("Scan started");
    router.push(`/dashboard/scans/${result.data.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="overflow-hidden">
        <div className="bg-ink p-5 sm:p-6">
          <label htmlFor="url" className="text-sm font-bold text-white">Website URL</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input id="url" placeholder="https://example.com" leftIcon={<Globe />} className="h-12 border-transparent text-base" aria-invalid={!!errors.url} {...register("url")} />
              {errors.url && <p className="mt-1.5 text-xs font-medium text-brand">{errors.url.message}</p>}
            </div>
            <Button type="submit" size="lg" loading={isLoading} icon={<ScanSearch className="size-4" />} disabled={catalog.isLoading}>
              Run {selected.size} checks
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Audit checks"
          description="Choose categories or expand them to pick individual checks."
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTouched(new Set(availableKeys))}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={() => setTouched(new Set())}>Clear</Button>
            </div>
          }
        />
        <CardBody>
          <QueryState isLoading={catalog.isLoading} error={catalog.error} onRetry={catalog.refetch}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {catalog.data?.map((category) => (
                <CategoryChecklist key={category.id} category={category} selected={selected} onToggle={toggle} />
              ))}
            </div>
          </QueryState>
        </CardBody>
      </Card>
    </form>
  );
}
