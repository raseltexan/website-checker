"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";

/** UI-level role gate. The API enforces the same rule server-side. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <EmptyState
        icon={<ShieldAlert />}
        title="Admin access required"
        description="You don't have permission to view the admin console."
        action={<LinkButton href="/dashboard" variant="dark" size="sm">Back to dashboard</LinkButton>}
      />
    );
  }
  return <>{children}</>;
}
