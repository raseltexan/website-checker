"use client";

import { UserMenu } from "@/components/layout/UserMenu";
import { LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useGetPublicStatsQuery } from "@/services/publicApi";
import { GuestActions, HomeView } from "./HomeView";

/** Home page with the visitor's session and live catalog/scan numbers from the API. */
export function LiveHome() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: stats } = useGetPublicStatsQuery();

  const actions = isLoading ? (
    <span className="size-9 animate-pulse rounded-full bg-canvas" aria-hidden />
  ) : isAuthenticated ? (
    <>
      <LinkButton href="/dashboard" variant="ghost" size="sm" className="hidden sm:inline-flex">Dashboard</LinkButton>
      <UserMenu showDashboardLink logoutRedirect="/" />
    </>
  ) : (
    <GuestActions />
  );

  return <HomeView actions={actions} stats={stats} />;
}
