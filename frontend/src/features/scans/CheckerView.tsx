"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckerForm } from "./CheckerForm";

export function CheckerView() {
  const params = useSearchParams();
  return (
    <>
      <PageHeader
        eyebrow="Website Checker"
        title="Run a website audit"
        description="Enter a URL and choose which checks to run. Results stream in live as each check completes."
      />
      <CheckerForm defaultUrl={params.get("url") ?? ""} websiteId={params.get("websiteId") ?? undefined} />
    </>
  );
}
