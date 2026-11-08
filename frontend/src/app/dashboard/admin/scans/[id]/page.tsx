import type { Metadata } from "next";
import { AdminScanDetailView } from "@/features/admin/content/AdminScanDetailView";

export const metadata: Metadata = { title: "Scan Details" };

export default function Page() {
  return <AdminScanDetailView />;
}
