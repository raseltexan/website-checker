import { useEffect, useMemo, useState } from "react";
import type { ListParams } from "@/types/api";

export function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Local state for paginated, searchable, filterable tables. */
export function useListParams(initial: Partial<ListParams> = {}) {
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState("");
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const debouncedSearch = useDebounce(search);

  const params = useMemo<ListParams>(
    () => ({ limit: 10, ...initial, page, search: debouncedSearch || undefined, ...filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, debouncedSearch, filters],
  );

  return {
    params,
    page,
    setPage,
    search,
    setSearch: (value: string) => {
      setSearchValue(value);
      setPage(1);
    },
    filters,
    setFilter: (key: string, value?: string) => {
      setFilters((prev) => ({ ...prev, [key]: value || undefined }));
      setPage(1);
    },
  };
}
