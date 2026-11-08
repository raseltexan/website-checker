import type { Metadata } from "next";
import { WebsitesView } from "@/features/websites/WebsitesView";

export const metadata: Metadata = { title: "Websites" };

export default function Page() {
  return <WebsitesView />;
}
