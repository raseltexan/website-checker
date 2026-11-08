"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useCreateWebsiteMutation, useUpdateWebsiteMutation } from "@/services/websitesApi";
import type { Website } from "@/types/models";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  url: z.string().trim().min(3, "Enter a URL").max(2048),
  tags: z.string().max(300),
});
type Values = z.infer<typeof schema>;

interface WebsiteFormModalProps {
  open: boolean;
  onClose: () => void;
  website?: Website | null;
}

export function WebsiteFormModal({ open, onClose, website }: WebsiteFormModalProps) {
  const toast = useToast();
  const [create, createState] = useCreateWebsiteMutation();
  const [update, updateState] = useUpdateWebsiteMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: website?.name ?? "", url: website?.url ?? "", tags: website?.tags.join(", ") ?? "" },
  });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: Values) => {
    const body = { ...values, tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10) };
    const res = website ? await update({ id: website.id, ...body }) : await create(body);
    if ("error" in res) return toast.error(res.error);
    toast.success(website ? "Website updated" : "Website added");
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={website ? "Edit website" : "Add website"}
      description="Websites group your scans and track score history."
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button type="submit" form="website-form" loading={createState.isLoading || updateState.isLoading}>
            {website ? "Save changes" : "Add website"}
          </Button>
        </>
      }
    >
      <form id="website-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Name" htmlFor="w-name" error={errors.name?.message}>
          <Input id="w-name" placeholder="Company website" aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField label="URL" htmlFor="w-url" error={errors.url?.message}>
          <Input id="w-url" placeholder="https://example.com" aria-invalid={!!errors.url} {...register("url")} />
        </FormField>
        <FormField label="Tags" htmlFor="w-tags" hint="Comma separated, e.g. client, production">
          <Input id="w-tags" placeholder="client, production" {...register("tags")} />
        </FormField>
      </form>
    </Modal>
  );
}
