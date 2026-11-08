import type { CheckStatus, Severity } from "@prisma/client";

const SEVERITY_MULTIPLIER: Record<Severity, number> = { LOW: 1, MEDIUM: 1.5, HIGH: 2, CRITICAL: 3 };
const STATUS_SCORE: Partial<Record<CheckStatus, number>> = { PASS: 100, WARN: 50, FAIL: 0 };

export interface ScoredResult {
  categoryKey: string;
  status: CheckStatus;
  severity: Severity;
  weight: number;
}

export const statusScore = (status: CheckStatus) => STATUS_SCORE[status] ?? null;

/** Weighted average over results that could be evaluated. ERROR / UNAVAILABLE / SKIPPED are excluded. */
const weightedScore = (results: ScoredResult[]) => {
  let total = 0;
  let weights = 0;
  for (const r of results) {
    const score = statusScore(r.status);
    if (score === null) continue;
    const w = r.weight * SEVERITY_MULTIPLIER[r.severity];
    total += score * w;
    weights += w;
  }
  return weights ? Math.round(total / weights) : null;
};

export const computeScores = (results: ScoredResult[]) => {
  const byCategory = new Map<string, ScoredResult[]>();
  for (const r of results) byCategory.set(r.categoryKey, [...(byCategory.get(r.categoryKey) ?? []), r]);

  const categoryScores = Object.fromEntries([...byCategory].map(([key, list]) => [key, weightedScore(list)]));
  const summary = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});

  return { score: weightedScore(results), categoryScores, summary: { total: results.length, ...summary } };
};
