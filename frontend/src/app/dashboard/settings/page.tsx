import type { Metadata } from "next";
import { SettingsView } from "@/features/profile/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsView />;
}
