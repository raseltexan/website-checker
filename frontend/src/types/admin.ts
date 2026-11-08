import type { ActivityLog, BrowserSettings, Check, Plan, Scan, ScanStatus, Subscription, User, UserSessionInfo } from "./models";

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface AdminOverview {
  totals: { users: number; admins: number; banned: number; websites: number; scans: number; reports: number; activeScans: number };
  last30Days: { newUsers: number; scans: number; failedScans: number; averageScore: number | null };
  charts: {
    scansPerDay: SeriesPoint[];
    signupsPerDay: SeriesPoint[];
    averageScorePerDay: SeriesPoint[];
    planDistribution: { name: string; value: number }[];
  };
  recentScans: (Pick<Scan, "id" | "url" | "status" | "score" | "createdAt"> & { user: { name: string; email: string } })[];
}

export interface AdminUserRow extends User {
  subscription?: { plan: { name: string }; status: string } | null;
  _count: { websites: number; scans: number };
}

export interface AdminUserDetail extends User {
  subscription?: Subscription | null;
  _count: { websites: number; scans: number; reports: number };
  sessions: UserSessionInfo[];
  activityLogs: ActivityLog[];
}

type ServiceStatus = "up" | "down" | "not_configured";

export interface SystemHealth {
  status: "healthy" | "degraded";
  checkedAt: string;
  services: {
    api: { status: ServiceStatus; uptimeSeconds: number };
    database: { status: ServiceStatus; latencyMs: number | null; error?: string };
    smtp: { status: ServiceStatus; error?: string };
    scanner: { status: ServiceStatus; pending: number; active: number; concurrency: number; checksRegistered: number };
    browser: BrowserProviderStatus;
  };
  runtime: {
    node: string;
    environment: string;
    platform: string;
    cpus: number;
    loadAverage: number[];
    memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
    system: { totalMb: number; freeMb: number };
  };
}

export interface BrowserProviderStatus {
  provider: BrowserSettings["provider"];
  available: boolean;
  reason: string;
}

export interface SecurityOverview {
  stats: { failedLogins24h: number; securityEvents24h: number; bannedUsers: number; activeSessions: number };
  bannedUsers: Pick<User, "id" | "name" | "email" | "banReason" | "banExpires">[];
  recentEvents: ActivityLog[];
  sessions: UserSessionInfo[];
}

export interface EmailOverview {
  smtp: { configured: boolean; reachable: boolean; error?: string; host: string | null; port: number; secure: boolean; from: string; user: string | null };
  stats: Partial<Record<"SENT" | "FAILED" | "SKIPPED", number>>;
}

export interface BrowserTestingData {
  config: BrowserSettings;
  status: BrowserProviderStatus;
  checks: (Omit<Check, "requires" | "available" | "unavailableReason"> & { category: { name: string } })[];
}

export interface ScanQueueStats {
  queue: { pending: number; active: number; concurrency: number };
  byStatus: Partial<Record<ScanStatus, number>>;
}

export type PlanInput = Omit<Plan, "id" | "subscribers">;
