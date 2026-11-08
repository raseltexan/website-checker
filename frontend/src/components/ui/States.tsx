import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/utils/errors";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted", className)}>
      <Spinner className="size-6 text-ink" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, title = "Couldn't load this", onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-red-50 text-danger">
        <AlertTriangle className="size-5" />
      </span>
      <div>
        <p className="font-bold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-muted">{getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-brand-100 text-ink [&>svg]:size-5">{icon ?? <Inbox />}</span>
      <div>
        <p className="font-bold text-ink-900">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Renders the right state for an RTK Query result, or the children when data is ready. */
export function QueryState({
  isLoading,
  error,
  onRetry,
  children,
}: {
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  return <>{children}</>;
}
