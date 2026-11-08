"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useRequestPasswordResetMutation } from "@/services/authApi";
import { getErrorMessage } from "@/utils/errors";
import { AuthCard, FormAlert } from "./AuthCard";
import { forgotPasswordSchema, type ForgotPasswordValues } from "./schemas";

export function ForgotPasswordForm() {
  const [requestReset, { isLoading, error, isSuccess }] = useRequestPasswordResetMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your account email and we'll send you a secure reset link."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-ink hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      }
    >
      {isSuccess ? (
        <FormAlert tone="success">If an account exists for that email, a reset link is on its way. Check your inbox.</FormAlert>
      ) : (
        <form onSubmit={handleSubmit((v) => requestReset(v))} className="space-y-4" noValidate>
          {error && <FormAlert>{getErrorMessage(error)}</FormAlert>}
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" leftIcon={<Mail />} aria-invalid={!!errors.email} {...register("email")} />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
