import type { Metadata } from "next";
import { BrowserTestingView } from "@/features/admin/engine/BrowserTestingView";

export const metadata: Metadata = { title: "Browser & Device Testing" };

export default function Page() {
  return <BrowserTestingView />;
}
