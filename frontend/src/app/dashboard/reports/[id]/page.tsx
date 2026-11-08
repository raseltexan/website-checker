import type { Metadata } from "next";
import { ReportDetailView } from "@/features/reports/ReportDetailView";

export const metadata: Metadata = { title: "Report Preview" };

export default function Page() {
  return <ReportDetailView />;
}
