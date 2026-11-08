import type { Metadata } from "next";
import { AdminScansView } from "@/features/admin/content/AdminScansView";

export const metadata: Metadata = { title: "Scan Management" };

export default function Page() {
  return <AdminScansView />;
}
