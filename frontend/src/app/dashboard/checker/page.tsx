import type { Metadata } from "next";
import { CheckerView } from "@/features/scans/CheckerView";

export const metadata: Metadata = { title: "Website Checker" };

export default function Page() {
  return <CheckerView />;
}
