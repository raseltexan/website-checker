import type { Metadata } from "next";
import { SecurityView } from "@/features/admin/system/SecurityView";

export const metadata: Metadata = { title: "Security Monitoring" };

export default function Page() {
  return <SecurityView />;
}
