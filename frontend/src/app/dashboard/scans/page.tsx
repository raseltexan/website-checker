import type { Metadata } from "next";
import { ScanHistoryView } from "@/features/scans/ScanHistoryView";

export const metadata: Metadata = { title: "Scan History" };

export default function Page() {
  return <ScanHistoryView />;
}
