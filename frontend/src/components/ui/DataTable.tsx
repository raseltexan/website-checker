import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PaginationMeta } from "@/types/api";
import { EmptyState, ErrorState } from "./States";
import { Skeleton } from "./Spinner";
import { Pagination } from "./Pagination";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on small screens to keep tables readable on mobile. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  empty?: { title: string; description?: string; action?: ReactNode; icon?: ReactNode };
}

export function DataTable<T>({ columns, rows, rowKey, isLoading, error, onRetry, meta, onPageChange, empty }: DataTableProps<T>) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!isLoading && !rows?.length) return <EmptyState title={empty?.title ?? "Nothing here yet"} description={empty?.description} action={empty?.action} icon={empty?.icon} />;

  const hidden = (c: Column<T>) => (c.hideOnMobile ? "hidden md:table-cell" : "");

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto">
        {/* Mobile hides `hideOnMobile` columns, so the fixed minimum width only applies from md up. */}
        <table className="w-full text-left text-sm md:min-w-[560px]">
          <thead>
            <tr className="border-b border-line bg-canvas/60">
              {columns.map((c) => (
                <th key={c.header} className={cn("px-5 py-3 text-xs font-bold tracking-wide text-muted uppercase", hidden(c), c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.header} className={cn("px-5 py-4", hidden(c))}>
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows!.map((row) => (
                  <tr key={rowKey(row)} className="transition-colors hover:bg-canvas/60">
                    {columns.map((c) => (
                      <td key={c.header} className={cn("px-5 py-3.5 align-middle", hidden(c), c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {meta && onPageChange && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  );
}
