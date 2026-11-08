"use client";

import { Menu, ScanSearch } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { setSidebarOpen } from "@/redux/slices/uiSlice";
import { LinkButton } from "@/components/ui/Button";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  const dispatch = useAppDispatch();
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
      <button className="grid size-9 place-items-center rounded-lg hover:bg-black/5 lg:hidden" onClick={() => dispatch(setSidebarOpen(true))} aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <div className="flex-1" />
      <LinkButton href="/dashboard/checker" size="sm" icon={<ScanSearch className="size-4" />} className="hidden sm:inline-flex">
        New scan
      </LinkButton>
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
