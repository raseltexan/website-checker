"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/States";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Authenticated application frame. The proxy does an optimistic cookie check;
 * this verifies the session with the API and redirects if it is missing.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return <LoadingState label="Loading your workspace…" className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-3 print:pl-0">
        <Topbar />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-3 lg:py-8">
          <Suspense fallback={<LoadingState />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
