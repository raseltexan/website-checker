import type { Metadata } from "next";
import { WebsiteDetailView } from "@/features/websites/WebsiteDetailView";

export const metadata: Metadata = { title: "Website" };

export default function Page() {
  return <WebsiteDetailView />;
}
