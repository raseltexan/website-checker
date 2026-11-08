"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useSignInMutation } from "@/services/authApi";
import { getErrorMessage } from "@/utils/errors";
import { AuthCard, FormAlert } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";
import { loginSchema, type LoginValues } from "./schemas";

/** Only allow same-site relative redirects. */
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [signIn, { isLoading, error }] = useSignInMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (values: LoginValues) => {
    const result = await signIn(values);
    if (!("error" in result)) router.replace(safeNext(params.get("next")));
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to audit and monitor your websites."
      footer={<>Don&apos;t have an account? <Link href="/register" className="font-bold text-ink underline-offset-4 hover:underline">Create one</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <FormAlert>{getErrorMessage(error, "Invalid email or password")}</FormAlert>}
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" leftIcon={<Mail />} aria-invalid={!!errors.email} {...register("email")} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register("password")} />
        </FormField>
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register("rememberMe")} />
          <Link href="/forgot-password" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
