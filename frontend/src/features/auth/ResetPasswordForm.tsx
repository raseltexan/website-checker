"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LinkButton } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useResetPasswordMutation } from "@/services/authApi";
import { getErrorMessage } from "@/utils/errors";
import { AuthCard, FormAlert } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";
import { resetPasswordSchema, type ResetPasswordValues } from "./schemas";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [resetPassword, { isLoading, error, isSuccess }] = useResetPasswordMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <AuthCard title="Invalid reset link" description="This password reset link is missing or malformed.">
        <LinkButton href="/forgot-password" size="lg" className="w-full">Request a new link</LinkButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Choose a strong password you don't use elsewhere.">
      {isSuccess ? (
        <div className="space-y-4">
          <FormAlert tone="success">Your password has been reset. You can now sign in.</FormAlert>
          <LinkButton href="/login" size="lg" className="w-full">Go to sign in</LinkButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit((v) => resetPassword({ token, newPassword: v.password }))} className="space-y-4" noValidate>
          {error && (
            <FormAlert>
              {getErrorMessage(error, "This link is invalid or has expired.")} <Link href="/forgot-password" className="underline">Request a new one</Link>
            </FormAlert>
          )}
          <FormField label="New password" htmlFor="password" error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
