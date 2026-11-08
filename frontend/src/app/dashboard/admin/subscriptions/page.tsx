import type { Metadata } from "next";
import { AdminSubscriptionsView } from "@/features/admin/billing/AdminSubscriptionsView";

export const metadata: Metadata = { title: "Subscriptions & Plans" };

export default function Page() {
  return <AdminSubscriptionsView />;
}
