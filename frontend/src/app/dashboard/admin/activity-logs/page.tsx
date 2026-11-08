import type { Metadata } from "next";
import { ActivityLogsView } from "@/features/admin/system/ActivityLogsView";

export const metadata: Metadata = { title: "Activity Logs" };

export default function Page() {
  return <ActivityLogsView />;
}
