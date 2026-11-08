import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatLimit } from "@/utils/format";
import type { Plan, Usage } from "@/types/models";

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit < 0 ? 0 : Math.round((used / Math.max(limit, 1)) * 100);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">
          <span className="font-bold text-ink">{used}</span> / {formatLimit(limit)}
        </span>
      </div>
      <ProgressBar value={limit < 0 ? 4 : pct} tone={pct >= 90 ? "dark" : "brand"} />
    </div>
  );
}

export function UsageCard({ plan, usage }: { plan: Plan | null; usage: Usage }) {
  return (
    <Card>
      <CardHeader title="Plan usage" description={plan ? `${plan.name} plan · resets monthly` : "No active plan"} action={<LinkButton href="/dashboard/billing" variant="outline" size="sm">Manage</LinkButton>} />
      <CardBody className="space-y-5">
        <Meter label="Scans this month" used={usage.scansThisMonth} limit={plan?.scanLimit ?? 0} />
        <Meter label="Websites" used={usage.websites} limit={plan?.websiteLimit ?? 0} />
      </CardBody>
    </Card>
  );
}
