import type { Metadata } from "next";
import { AdminWebsitesView } from "@/features/admin/content/AdminWebsitesView";

export const metadata: Metadata = { title: "Website Management" };

export default function Page() {
  return <AdminWebsitesView />;
}
