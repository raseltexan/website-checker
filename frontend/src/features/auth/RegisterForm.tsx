"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useSignUpMutation } from "@/services/authApi";
import { getErrorMessage } from "@/utils/errors";
import { AuthCard, FormAlert } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";
import { registerSchema, type RegisterValues } from "./schemas";

export function RegisterForm() {
  const router = useRouter();
  const [signUp, { isLoading, error }] = useSignUpMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ name, email, password }: RegisterValues) => {
    const result = await signUp({ name, email, password });
    if (!("error" in result)) router.replace("/dashboard");
  };

  return (
    <AuthCard
      title="Create your account"
      description="Start auditing websites in minutes. No credit card required."
      footer={<>Already have an account? <Link href="/login" className="font-bold text-ink underline-offset-4 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <FormAlert>{getErrorMessage(error)}</FormAlert>}
        <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Jane Cooper" leftIcon={<User />} aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" leftIcon={<Mail />} aria-invalid={!!errors.email} {...register("email")} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </FormField>
        </div>
        <div>
          <Checkbox label="I agree to the Terms of Service and Privacy Policy" {...register("terms")} />
          {errors.terms && <p className="mt-1 text-xs font-medium text-danger">{errors.terms.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
