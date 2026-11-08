"use client";

import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Checkbox";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { useUpdateCheckMutation } from "@/services/adminApi";
import type { Check, Severity } from "@/types/models";

const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Inline editor for one check: enable toggle, severity and scoring weight. */
export function CheckRow({ check, disabled }: { check: Check; disabled?: boolean }) {
  const toast = useToast();
  const [update, { isLoading }] = useUpdateCheckMutation();

  const save = async (patch: Partial<Pick<Check, "isEnabled" | "severity" | "weight">>) => {
    const res = await update({ id: check.id, ...patch });
    if ("error" in res) toast.error(res.error);
  };

  return (
    <li className="grid grid-cols-1 gap-3 px-5 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold">{check.name}</p>
          <code className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-muted">{check.key}</code>
          {check.requires && <Badge tone={check.available ? "success" : "warning"}>{check.available ? "Integration ready" : "Needs integration"}</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-muted">{check.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select aria-label="Severity" className="h-8 w-28 text-xs" value={check.severity} disabled={disabled || isLoading} onChange={(e) => save({ severity: e.target.value as Severity })}>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </Select>
        <Input
          aria-label="Weight"
          type="number"
          min={1}
          max={10}
          defaultValue={check.weight}
          disabled={disabled || isLoading}
          className="h-8 w-16 text-xs"
          onBlur={(e) => {
            const weight = Math.min(10, Math.max(1, Number(e.target.value) || 1));
            if (weight !== check.weight) save({ weight });
          }}
        />
        <Switch label={`Enable ${check.name}`} checked={check.isEnabled} disabled={disabled || isLoading} onChange={(isEnabled) => save({ isEnabled })} />
      </div>
    </li>
  );
}
