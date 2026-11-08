"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryState } from "@/components/ui/States";
import { useToast } from "@/hooks/useToast";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/services/userApi";
import { formatDate } from "@/utils/format";

const TIMEZONES = ["UTC", "America/Chicago", "America/New_York", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dhaka", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"];

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  company: z.string().trim().max(100),
  timezone: z.string(),
  image: z.union([z.url("Enter a valid image URL"), z.literal("")]),
});
type Values = z.infer<typeof schema>;

export function ProfileView() {
  const toast = useToast();
  const { data: profile, isLoading, error, refetch } = useGetProfileQuery();
  const [update, { isLoading: saving }] = useUpdateProfileMutation();
  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: profile?.name ?? "", company: profile?.company ?? "", timezone: profile?.timezone ?? "UTC", image: profile?.image ?? "" },
  });
  const [previewName, previewImage] = useWatch({ control, name: ["name", "image"] });

  const onSubmit = async (values: Values) => {
    const res = await update(values);
    if ("error" in res) toast.error(res.error);
    else toast.success("Profile updated");
  };

  return (
    <>
      <PageHeader title="Profile" description="Your personal information and how it appears on reports." />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {profile && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center p-6 text-center">
              <Avatar name={previewName} image={previewImage || null} className="size-20 text-xl" />
              <p className="mt-4 text-lg font-extrabold">{profile.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted"><Mail className="size-3.5" />{profile.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge tone={profile.role === "admin" ? "dark" : "neutral"}>{profile.role === "admin" ? "Administrator" : "Member"}</Badge>
                <Badge tone="brand">{profile.plan?.name ?? "No"} plan</Badge>
                <Badge tone={profile.emailVerified ? "success" : "warning"}>{profile.emailVerified ? "Verified" : "Unverified"}</Badge>
              </div>
              <p className="mt-4 text-xs text-muted">Member since {formatDate(profile.createdAt)}</p>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Personal details" />
              <CardBody>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
                  <FormField label="Full name" htmlFor="p-name" error={errors.name?.message}>
                    <Input id="p-name" aria-invalid={!!errors.name} {...register("name")} />
                  </FormField>
                  <FormField label="Email" htmlFor="p-email" hint="Contact support to change your email.">
                    <Input id="p-email" value={profile.email} disabled readOnly />
                  </FormField>
                  <FormField label="Company" htmlFor="p-company" hint="Shown as “Prepared for” on reports.">
                    <Input id="p-company" placeholder="Acme Inc." {...register("company")} />
                  </FormField>
                  <FormField label="Timezone" htmlFor="p-tz">
                    <Select id="p-tz" {...register("timezone")}>
                      {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Avatar URL" htmlFor="p-image" error={errors.image?.message} className="sm:col-span-2">
                    <Input id="p-image" placeholder="https://…/avatar.png" aria-invalid={!!errors.image} {...register("image")} />
                  </FormField>
                  <div className="flex justify-end sm:col-span-2">
                    <Button type="submit" loading={saving} disabled={!isDirty}>Save changes</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        )}
      </QueryState>
    </>
  );
}
