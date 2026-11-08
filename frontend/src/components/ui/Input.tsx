import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink-900 placeholder:text-muted/70 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:bg-canvas aria-invalid:border-danger aria-invalid:ring-danger/20";

interface InputProps extends ComponentProps<"input"> {
  leftIcon?: ReactNode;
}

export function Input({ className, leftIcon, ...props }: InputProps) {
  if (!leftIcon) return <input className={cn(fieldBase, "h-10", className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:size-4">{leftIcon}</span>
      <input className={cn(fieldBase, "h-10 pl-9", className)} {...props} />
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "h-10 cursor-pointer pr-8", className)} {...props}>
      {children}
    </select>
  );
}
