"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/features/auth/PasswordInput";
import { changePasswordSchema, type ChangePasswordValues } from "@/features/auth/schemas";
import { useToast } from "@/hooks/useToast";
import { useChangePasswordMutation } from "@/services/authApi";

export function ChangePasswordCard() {
  const toast = useToast();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "", revokeOtherSessions: true },
  });

  const onSubmit = async ({ currentPassword, newPassword, revokeOtherSessions }: ChangePasswordValues) => {
    const res = await changePassword({ currentPassword, newPassword, revokeOtherSessions });
    if ("error" in res) return toast.error(res.error);
    toast.success("Password changed");
    reset();
  };

  return (
    <Card>
      <CardHeader title="Change password" description="Use at least 8 characters. Avoid reusing passwords." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Current password" htmlFor="cp-current" error={errors.currentPassword?.message}>
            <PasswordInput id="cp-current" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register("currentPassword")} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="New password" htmlFor="cp-new" error={errors.newPassword?.message}>
              <PasswordInput id="cp-new" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register("newPassword")} />
            </FormField>
            <FormField label="Confirm new password" htmlFor="cp-confirm" error={errors.confirmPassword?.message}>
              <PasswordInput id="cp-confirm" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
            </FormField>
          </div>
          <Checkbox label="Sign out of all other devices" {...register("revokeOtherSessions")} />
          <div className="flex justify-end">
            <Button type="submit" loading={isLoading}>Update password</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
