import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return <ResetPasswordForm />;
}
