import type { Metadata } from "next";
import { AuditConfigView } from "@/features/admin/engine/AuditConfigView";

export const metadata: Metadata = { title: "Audit Configuration" };

export default function Page() {
  return <AuditConfigView />;
}
