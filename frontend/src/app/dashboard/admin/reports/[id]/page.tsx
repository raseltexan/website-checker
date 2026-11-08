import type { Metadata } from "next";
import { AdminReportDetailView } from "@/features/admin/content/AdminReportDetailView";

export const metadata: Metadata = { title: "Report Preview" };

export default function Page() {
  return <AdminReportDetailView />;
}
