import { useState } from "react";
import type { Scan } from "@/types/models";

type ScanQueryHook = (
  id: string,
  options: { pollingInterval: number; skipPollingIfUnfocused: boolean },
) => { data?: Scan; isLoading: boolean; error?: unknown; refetch: () => unknown };

const isActive = (scan?: Scan) => !scan || scan.status === "QUEUED" || scan.status === "RUNNING";

/** Fetches a scan and polls every 2s only while it is queued or running. */
export function useLiveScan(id: string, useQuery: ScanQueryHook) {
  const [polling, setPolling] = useState(true);
  const query = useQuery(id, { pollingInterval: polling ? 2000 : 0, skipPollingIfUnfocused: true });
  const active = !query.error && isActive(query.data);
  // Adjusting state during render is React's recommended pattern for derived updates.
  if (active !== polling) setPolling(active);
  return { ...query, scan: query.data, active: Boolean(query.data) && isActive(query.data) };
}
