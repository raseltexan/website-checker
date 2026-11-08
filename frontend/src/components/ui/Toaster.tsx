"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { dismissToast, type Toast } from "@/redux/slices/uiSlice";
import { cn } from "@/lib/cn";

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const accents = { success: "text-success", error: "text-danger", info: "text-info" };

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const Icon = icons[toast.tone];
  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 4500);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);
  return (
    <div role="status" className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white shadow-xl">
      <Icon className={cn("mt-0.5 size-4 shrink-0", accents[toast.tone])} />
      <p className="flex-1">{toast.message}</p>
      <button onClick={() => dispatch(dismissToast(toast.id))} aria-label="Dismiss" className="text-white/50 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
