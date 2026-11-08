"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CreditCard, LogOut, Settings, Shield, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { ADMIN_BASE } from "@/lib/navigation";

export function UserMenu() {
  const { user, isAdmin } = useAuth();
  const { logout, isLoading } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const links = [
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    ...(isAdmin ? [{ href: ADMIN_BASE, label: "Admin console", icon: Shield }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-black/5" aria-expanded={open} aria-haspopup="menu">
        <Avatar name={user?.name} image={user?.image} className="size-8" />
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{user?.name}</span>
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="p-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-canvas" role="menuitem">
                <Icon className="size-4 text-muted" />
                {label}
              </Link>
            ))}
            <button onClick={logout} disabled={isLoading} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-red-50" role="menuitem">
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
