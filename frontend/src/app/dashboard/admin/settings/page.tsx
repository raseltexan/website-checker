import type { Metadata } from "next";
import { AdminSettingsView } from "@/features/admin/system/AdminSettingsView";

export const metadata: Metadata = { title: "Admin Settings" };

export default function Page() {
  return <AdminSettingsView />;
}
