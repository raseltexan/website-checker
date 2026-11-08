import type { Metadata } from "next";
import { ScanDetailPage } from "@/features/scans/ScanDetailPage";

export const metadata: Metadata = { title: "Scan" };

export default function Page() {
  return <ScanDetailPage />;
}
