import type { Metadata } from "next";
import { ReportsView } from "@/features/reports/ReportsView";

export const metadata: Metadata = { title: "Audit Reports" };

export default function Page() {
  return <ReportsView />;
}
