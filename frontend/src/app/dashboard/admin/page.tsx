import type { Metadata } from "next";
import { AdminOverviewView } from "@/features/admin/AdminOverviewView";

export const metadata: Metadata = { title: "Admin Overview" };

export default function Page() {
  return <AdminOverviewView />;
}
