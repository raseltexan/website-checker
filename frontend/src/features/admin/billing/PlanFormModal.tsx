"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useCreatePlanMutation, useUpdatePlanMutation } from "@/services/adminApi";
import type { Plan } from "@/types/models";

const schema = z.object({
  name: z.string().trim().min(2, "Required").max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes").min(2),
  description: z.string().trim().max(300),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  scanLimit: z.number().int().min(-1),
  websiteLimit: z.number().int().min(-1),
  features: z.string().max(2000),
  order: z.number().int(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toValues = (p?: Plan | null): Values => ({
  name: p?.name ?? "",
  slug: p?.slug ?? "",
  description: p?.description ?? "",
  priceMonthly: (p?.priceMonthly ?? 0) / 100,
  priceYearly: (p?.priceYearly ?? 0) / 100,
  scanLimit: p?.scanLimit ?? 10,
  websiteLimit: p?.websiteLimit ?? 1,
  features: p?.features.join("\n") ?? "",
  order: p?.order ?? 0,
  isActive: p?.isActive ?? true,
  isDefault: p?.isDefault ?? false,
});

export function PlanFormModal({ open, onClose, plan }: { open: boolean; onClose: () => void; plan?: Plan | null }) {
  const toast = useToast();
  const [create, createState] = useCreatePlanMutation();
  const [update, updateState] = useUpdatePlanMutation();
  const { register, control, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), values: toValues(plan) });
  const num = { valueAsNumber: true } as const;

  const onSubmit = async (v: Values) => {
    const body = {
      ...v,
      priceMonthly: Math.round(v.priceMonthly * 100),
      priceYearly: Math.round(v.priceYearly * 100),
      features: v.features.split("\n").map((f) => f.trim()).filter(Boolean),
    };
    const res = plan ? await update({ id: plan.id, ...body }) : await create(body);
    if ("error" in res) return toast.error(res.error);
    toast.success(plan ? "Plan updated" : "Plan created");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={plan ? `Edit ${plan.name}` : "Create plan"}
      description="Prices in USD. Use -1 for unlimited."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="plan-form" loading={createState.isLoading || updateState.isLoading}>{plan ? "Save plan" : "Create plan"}</Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <FormField label="Name" htmlFor="pl-name" error={errors.name?.message}><Input id="pl-name" {...register("name")} /></FormField>
        <FormField label="Slug" htmlFor="pl-slug" error={errors.slug?.message}><Input id="pl-slug" {...register("slug")} /></FormField>
        <FormField label="Description" htmlFor="pl-desc" className="sm:col-span-2"><Input id="pl-desc" {...register("description")} /></FormField>
        <FormField label="Monthly price ($)" htmlFor="pl-pm" error={errors.priceMonthly?.message}><Input id="pl-pm" type="number" step="0.01" {...register("priceMonthly", num)} /></FormField>
        <FormField label="Yearly price ($)" htmlFor="pl-py" error={errors.priceYearly?.message}><Input id="pl-py" type="number" step="0.01" {...register("priceYearly", num)} /></FormField>
        <FormField label="Scans / month" htmlFor="pl-sl" error={errors.scanLimit?.message}><Input id="pl-sl" type="number" {...register("scanLimit", num)} /></FormField>
        <FormField label="Websites" htmlFor="pl-wl" error={errors.websiteLimit?.message}><Input id="pl-wl" type="number" {...register("websiteLimit", num)} /></FormField>
        <FormField label="Features" htmlFor="pl-feat" hint="One per line" className="sm:col-span-2"><Textarea id="pl-feat" {...register("features")} /></FormField>
        <FormField label="Display order" htmlFor="pl-order"><Input id="pl-order" type="number" {...register("order", num)} /></FormField>
        <div className="flex items-end gap-6 pb-2">
          {(["isActive", "isDefault"] as const).map((name) => (
            <label key={name} className="flex items-center gap-2 text-sm font-semibold">
              <Controller name={name} control={control} render={({ field }) => <Switch label={name} checked={field.value} onChange={field.onChange} />} />
              {name === "isActive" ? "Active" : "Default"}
            </label>
          ))}
        </div>
      </form>
    </Modal>
  );
}
