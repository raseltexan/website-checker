import type { Metadata } from "next";
import { EmailMonitoringView } from "@/features/admin/system/EmailMonitoringView";

export const metadata: Metadata = { title: "Email & SMTP" };

export default function Page() {
  return <EmailMonitoringView />;
}
