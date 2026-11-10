import type { CheckStatus, Severity } from "@prisma/client";
import type { ScanContext } from "./context.js";

export interface CheckOutcome {
  status: CheckStatus;
  message: string;
  /** 0–100. Derived from status when omitted. */
  score?: number;
  details?: Record<string, unknown>;
}

/** External capabilities a check may need. Checks whose requirement is missing return UNAVAILABLE. */
export type CheckRequirement = "browser";

export interface CheckDefinition {
  key: string;
  categoryKey: string;
  name: string;
  description: string;
  severity: Severity;
  weight: number;
  requires?: CheckRequirement;
  /** Always included in every scan; cannot be deselected by users or disabled by admins. */
  mandatory?: boolean;
  run: (ctx: ScanContext) => Promise<CheckOutcome>;
}

export interface CategoryDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

/** Small helpers so check implementations stay terse. */
export const pass = (message: string, details?: Record<string, unknown>): CheckOutcome => ({ status: "PASS", message, details });
export const warn = (message: string, details?: Record<string, unknown>): CheckOutcome => ({ status: "WARN", message, details });
export const fail = (message: string, details?: Record<string, unknown>): CheckOutcome => ({ status: "FAIL", message, details });
export const unavailable = (message: string): CheckOutcome => ({ status: "UNAVAILABLE", message });
