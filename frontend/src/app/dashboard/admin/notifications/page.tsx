import type { Metadata } from "next";
import { AdminNotificationsView } from "@/features/admin/system/AdminNotificationsView";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <AdminNotificationsView />;
}
