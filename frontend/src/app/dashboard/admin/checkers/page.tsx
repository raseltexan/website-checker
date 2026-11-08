import type { Metadata } from "next";
import { CheckersManagerView } from "@/features/admin/engine/CheckersManagerView";

export const metadata: Metadata = { title: "Checker Categories" };

export default function Page() {
  return <CheckersManagerView />;
}
