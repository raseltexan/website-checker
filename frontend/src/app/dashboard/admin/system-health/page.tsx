import type { Metadata } from "next";
import { SystemHealthView } from "@/features/admin/system/SystemHealthView";

export const metadata: Metadata = { title: "System Health" };

export default function Page() {
  return <SystemHealthView />;
}
