import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { getSetting } from "../modules/settings/settings.service.js";
import { ScanContext } from "./context.js";
import { CHECKS_BY_KEY } from "./registry.js";
import { computeScores, statusScore } from "./scoring.js";
import { getBrowserProviderStatus } from "./integrations/browser.js";
import type { CheckDefinition, CheckOutcome } from "./types.js";

const CHECK_CONCURRENCY = 4;
const CHECK_TIMEOUT_MS = 60_000;

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s`)), ms))]);

/** Loads enabled checks for a scan, applying admin overrides (severity, weight) from the DB. */
const resolveChecks = async (selected: string[]) => {
  const rows = await prisma.check.findMany({
    where: { key: { in: selected }, isEnabled: true, category: { isEnabled: true } },
    include: { category: { select: { order: true } } },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });
  return rows.flatMap((row) => {
    const def = CHECKS_BY_KEY.get(row.key);
    return def ? [{ ...def, name: row.name, severity: row.severity, weight: row.weight }] : [];
  });
};

const runCheck = async (ctx: ScanContext, check: CheckDefinition, browserAvailable: string | null): Promise<CheckOutcome & { durationMs: number }> => {
  const started = performance.now();
  if (check.requires === "browser" && browserAvailable) {
    return { status: "UNAVAILABLE", message: browserAvailable, durationMs: 0 };
  }
  try {
    const outcome = await withTimeout(check.run(ctx), CHECK_TIMEOUT_MS);
    return { ...outcome, durationMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { status: "ERROR", message: error instanceof Error ? error.message : "Check failed", durationMs: Math.round(performance.now() - started) };
  }
};

const isCancelled = async (scanId: string) =>
  (await prisma.scan.findUnique({ where: { id: scanId }, select: { status: true } }))?.status === "CANCELLED";

const notify = (userId: string, title: string, message: string, type: "SUCCESS" | "ERROR", link: string) =>
  prisma.notification.create({ data: { userId, title, message, type, link } });

const failScan = async (scanId: string, userId: string, url: string, error: string) => {
  await prisma.scan.update({ where: { id: scanId }, data: { status: "FAILED", error, completedAt: new Date() } });
  await notify(userId, "Scan failed", `Scan of ${url} failed: ${error}`, "ERROR", `/dashboard/scans/${scanId}`);
};

export const executeScan = async (scanId: string) => {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || scan.status !== "QUEUED") return;

  await prisma.scan.update({ where: { id: scanId }, data: { status: "RUNNING", startedAt: new Date(), progress: 0 } });

  const [audit, browser, checks] = await Promise.all([getSetting("audit"), getSetting("browser"), resolveChecks(scan.selectedChecks)]);
  if (!checks.length) return failScan(scanId, scan.userId, scan.url, "None of the selected checks are currently enabled");

  const ctx = new ScanContext(scan.url, audit, browser);
  let page;
  try {
    page = await ctx.page();
  } catch (error) {
    return failScan(scanId, scan.userId, scan.url, `Could not reach the website: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  await prisma.scan.update({ where: { id: scanId }, data: { finalUrl: page.finalUrl } });

  const providerStatus = getBrowserProviderStatus(browser);
  const browserUnavailable = providerStatus.available ? null : providerStatus.reason;
  const scored: { categoryKey: string; status: CheckOutcome["status"]; severity: CheckDefinition["severity"]; weight: number }[] = [];
  let done = 0;
  let cursor = 0;
  let cancelled = false;

  const worker = async () => {
    while (cursor < checks.length && !cancelled) {
      const check = checks[cursor++]!;
      const outcome = await runCheck(ctx, check, browserUnavailable);
      await prisma.scanResult.create({
        data: {
          scanId,
          checkKey: check.key,
          categoryKey: check.categoryKey,
          name: check.name,
          status: outcome.status,
          severity: check.severity,
          score: outcome.score ?? statusScore(outcome.status),
          message: outcome.message,
          details: (outcome.details ?? undefined) as Prisma.InputJsonValue | undefined,
          durationMs: outcome.durationMs,
        },
      });
      scored.push({ categoryKey: check.categoryKey, status: outcome.status, severity: check.severity, weight: check.weight });
      done++;
      if (await isCancelled(scanId)) cancelled = true;
      else await prisma.scan.update({ where: { id: scanId }, data: { progress: Math.round((done / checks.length) * 100) } });
    }
  };
  await Promise.all(Array.from({ length: CHECK_CONCURRENCY }, worker));
  if (cancelled) return;

  const { score, categoryScores, summary } = computeScores(scored);
  const finalScore = score ?? 0;
  await prisma.scan.update({
    where: { id: scanId },
    data: { status: "COMPLETED", progress: 100, score: finalScore, categoryScores, summary, completedAt: new Date() },
  });
  if (scan.websiteId) {
    await prisma.website.update({ where: { id: scan.websiteId }, data: { lastScanAt: new Date(), lastScore: finalScore } }).catch(() => undefined);
  }
  const host = new URL(page.finalUrl).hostname;
  await prisma.report.create({
    data: { scanId, userId: scan.userId, websiteId: scan.websiteId, title: `Audit report — ${host}`, url: page.finalUrl, score: finalScore },
  });
  await notify(scan.userId, "Scan completed", `${host} scored ${finalScore}/100`, "SUCCESS", `/dashboard/scans/${scanId}`);
};

/** In-process FIFO queue with bounded concurrency. Swap for a job queue (e.g. BullMQ) to scale horizontally. */
class ScanQueue {
  private readonly pending: string[] = [];
  private active = 0;

  constructor(private readonly concurrency: number) {}

  enqueue(scanId: string) {
    this.pending.push(scanId);
    this.drain();
  }

  stats() {
    return { pending: this.pending.length, active: this.active, concurrency: this.concurrency };
  }

  private drain() {
    while (this.active < this.concurrency && this.pending.length) {
      const id = this.pending.shift()!;
      this.active++;
      executeScan(id)
        .catch(async (error) => {
          console.error(`Scan ${id} crashed`, error);
          await prisma.scan.update({ where: { id }, data: { status: "FAILED", error: "Internal scanner error", completedAt: new Date() } }).catch(() => undefined);
        })
        .finally(() => {
          this.active--;
          this.drain();
        });
    }
  }
}

export const scanQueue = new ScanQueue(env.SCAN_MAX_CONCURRENCY);

/** On boot: fail scans interrupted by a restart and re-queue scans still waiting. */
export const recoverScans = async () => {
  await prisma.scan.updateMany({ where: { status: "RUNNING" }, data: { status: "FAILED", error: "Interrupted by server restart", completedAt: new Date() } });
  const queued = await prisma.scan.findMany({ where: { status: "QUEUED" }, select: { id: true }, orderBy: { createdAt: "asc" } });
  queued.forEach((s) => scanQueue.enqueue(s.id));
};
