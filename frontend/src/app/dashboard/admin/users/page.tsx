import type { Metadata } from "next";
import { AdminUsersView } from "@/features/admin/users/AdminUsersView";

export const metadata: Metadata = { title: "User Management" };

export default function Page() {
  return <AdminUsersView />;
}
