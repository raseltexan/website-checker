import type { Metadata } from "next";
import { AdminReportsView } from "@/features/admin/content/AdminReportsView";

export const metadata: Metadata = { title: "Reports Management" };

export default function Page() {
  return <AdminReportsView />;
}
