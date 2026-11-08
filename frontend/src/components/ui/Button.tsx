import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

const variants = {
  primary: "bg-brand text-ink hover:bg-brand-600 shadow-sm",
  dark: "bg-ink text-white hover:bg-ink-700",
  outline: "border border-line bg-surface text-ink-900 hover:bg-canvas",
  ghost: "text-ink-900 hover:bg-black/5",
  danger: "bg-danger text-white hover:bg-red-700",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
} as const;

export type ButtonVariant = keyof typeof variants;

interface StyleProps {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  className?: string;
}

export const buttonStyles = ({ variant = "primary", size = "md", className }: StyleProps = {}) =>
  cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

interface ButtonProps extends ComponentProps<"button">, StyleProps {
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, loading, icon, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonStyles({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link>, StyleProps {
  icon?: ReactNode;
}

export function LinkButton({ variant, size, className, icon, children, ...props }: LinkButtonProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
