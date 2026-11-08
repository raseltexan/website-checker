import type { Metadata } from "next";
import { AdminUserDetailView } from "@/features/admin/users/AdminUserDetailView";

export const metadata: Metadata = { title: "User Details" };

export default function Page() {
  return <AdminUserDetailView />;
}
