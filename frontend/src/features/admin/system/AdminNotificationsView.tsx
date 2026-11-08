"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, QueryState } from "@/components/ui/States";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { useBroadcastNotificationMutation, useGetAdminNotificationsQuery } from "@/services/adminApi";

const schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(100),
  message: z.string().trim().min(2, "Message is required").max(1000),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
  link: z.string().trim().max(300),
});
type Values = z.infer<typeof schema>;

function BroadcastForm() {
  const toast = useToast();
  const [broadcast, { isLoading }] = useBroadcastNotificationMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: "", message: "", type: "INFO", link: "" } });

  const onSubmit = async ({ link, ...values }: Values) => {
    const res = await broadcast({ ...values, link: link || undefined });
    if ("error" in res) return toast.error(res.error);
    toast.success(`Sent to ${res.data.sent} user(s)`);
    reset();
  };

  return (
    <Card>
      <CardHeader title="Broadcast announcement" description="Sends an in-app notification to every active user." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Title" htmlFor="n-title" error={errors.title?.message}>
            <Input id="n-title" aria-invalid={!!errors.title} {...register("title")} />
          </FormField>
          <FormField label="Message" htmlFor="n-message" error={errors.message?.message}>
            <Textarea id="n-message" aria-invalid={!!errors.message} {...register("message")} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Type" htmlFor="n-type">
              <Select id="n-type" {...register("type")}>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Alert</option>
              </Select>
            </FormField>
            <FormField label="Link (optional)" htmlFor="n-link" hint="In-app path, e.g. /dashboard/billing">
              <Input id="n-link" placeholder="/dashboard/billing" {...register("link")} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isLoading} icon={<Send className="size-4" />}>Send to all users</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function AdminNotificationsView() {
  const list = useListParams({ limit: 10 });
  const { data, isLoading, error, refetch } = useGetAdminNotificationsQuery(list.params);
  return (
    <>
      <PageHeader eyebrow="Admin · Monitoring" title="Notifications" description="Broadcast announcements and review notifications delivered to users." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
        <BroadcastForm />
        <Card>
          <CardHeader title="Delivered notifications" />
          <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
            {data?.data.length ? (
              <>
                <ul className="divide-y divide-line">
                  {data.data.map((n) => <NotificationItem key={n.id} notification={n} meta={n.user?.email} />)}
                </ul>
                <Pagination meta={data.meta} onPageChange={list.setPage} />
              </>
            ) : (
              <EmptyState icon={<Bell />} title="No notifications yet" />
            )}
          </QueryState>
        </Card>
      </div>
    </>
  );
}
