import { AlertTriangle, Ban, CheckCircle2, CircleSlash, Clock, Loader2, MinusCircle, XCircle } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import type { CheckStatus, ScanStatus, Severity } from "@/types/models";

const SCAN: Record<ScanStatus, { tone: Tone; label: string; icon: typeof Clock }> = {
  QUEUED: { tone: "neutral", label: "Queued", icon: Clock },
  RUNNING: { tone: "brand", label: "Running", icon: Loader2 },
  COMPLETED: { tone: "success", label: "Completed", icon: CheckCircle2 },
  FAILED: { tone: "danger", label: "Failed", icon: XCircle },
  CANCELLED: { tone: "neutral", label: "Cancelled", icon: Ban },
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const { tone, label, icon: Icon } = SCAN[status];
  return (
    <Badge tone={tone}>
      <Icon className={`size-3 ${status === "RUNNING" ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
}

export const CHECK_STATUS: Record<CheckStatus, { tone: Tone; label: string; icon: typeof Clock; color: string }> = {
  PASS: { tone: "success", label: "Passed", icon: CheckCircle2, color: "text-success" },
  WARN: { tone: "warning", label: "Warning", icon: AlertTriangle, color: "text-warning" },
  FAIL: { tone: "danger", label: "Failed", icon: XCircle, color: "text-danger" },
  ERROR: { tone: "danger", label: "Error", icon: CircleSlash, color: "text-danger" },
  SKIPPED: { tone: "neutral", label: "Skipped", icon: MinusCircle, color: "text-muted" },
  UNAVAILABLE: { tone: "neutral", label: "Unavailable", icon: MinusCircle, color: "text-muted" },
};

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  const { tone, label, icon: Icon } = CHECK_STATUS[status];
  return (
    <Badge tone={tone}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}

const SEVERITY: Record<Severity, Tone> = { LOW: "neutral", MEDIUM: "info", HIGH: "warning", CRITICAL: "danger" };

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={SEVERITY[severity]}>{severity.charAt(0) + severity.slice(1).toLowerCase()}</Badge>;
}
