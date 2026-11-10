"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ADMIN_BASE, adminNav, isActivePath, userNav } from "@/lib/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSidebarOpen } from "@/redux/slices/uiSlice";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "./Logo";

export function Sidebar() {
  const pathname = usePathname();
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const inAdmin = pathname.startsWith(ADMIN_BASE);
  const groups = inAdmin ? adminNav : userNav;
  const close = () => dispatch(setSidebarOpen(false));

  return (
    <>
      <div className={cn("fixed inset-0 z-40 bg-black/50 lg:hidden", open ? "block" : "hidden")} onClick={close} aria-hidden />
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-68 flex-col bg-ink text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo
            className="brightness-0 invert"
            href={inAdmin ? ADMIN_BASE : "/dashboard"}
            inverted
          />
          <button className="text-white/60 hover:text-white lg:hidden" onClick={close} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        {inAdmin && <p className="mx-5 mb-2 rounded-md bg-brand px-2 py-1 text-center text-[11px] font-extrabold tracking-widest text-ink uppercase">Admin Console</p>}

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-bold tracking-widest text-white/40 uppercase">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActivePath(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={close}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                          active ? "bg-brand text-ink" : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {isAdmin && (
          <div className="border-t border-white/10 p-3">
            <Link
              href={inAdmin ? "/dashboard" : ADMIN_BASE}
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeftRight className="size-4" />
              {inAdmin ? "Switch to user view" : "Open admin console"}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
