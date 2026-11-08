export type Role = "user" | "admin";
export type ScanStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type CheckStatus = "PASS" | "WARN" | "FAIL" | "ERROR" | "SKIPPED" | "UNAVAILABLE";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type LogLevel = "INFO" | "WARNING" | "SECURITY";
export type EmailStatus = "SENT" | "FAILED" | "SKIPPED";
export type SubscriptionStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface User extends UserSummary {
  emailVerified: boolean;
  image?: string | null;
  role?: Role | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  company?: string | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthSession {
  user: User;
  session: Session;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  scanLimit: number;
  websiteLimit: number;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  order: number;
  subscribers?: number;
}

export interface Usage {
  scansThisMonth: number;
  websites: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  interval: "monthly" | "yearly";
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  plan: Plan;
  user?: UserSummary;
}

export interface Profile extends User {
  plan: Plan | null;
  usage: Usage;
}

export interface UserSessionInfo {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  current?: boolean;
  user?: UserSummary & { role?: Role };
}

export interface Website {
  id: string;
  userId: string;
  name: string;
  url: string;
  domain: string;
  tags: string[];
  lastScanAt?: string | null;
  lastScore?: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { scans: number; reports?: number };
  user?: UserSummary;
  scans?: Pick<Scan, "id" | "status" | "score" | "createdAt" | "completedAt">[];
}

export interface ScanResult {
  id: string;
  scanId: string;
  checkKey: string;
  categoryKey: string;
  name: string;
  status: CheckStatus;
  severity: Severity;
  score?: number | null;
  message: string;
  details?: Record<string, unknown> | null;
  durationMs: number;
  createdAt: string;
}

export type ScanSummary = Partial<Record<CheckStatus, number>> & { total: number };

export interface Scan {
  id: string;
  userId: string;
  websiteId?: string | null;
  url: string;
  finalUrl?: string | null;
  status: ScanStatus;
  progress: number;
  selectedChecks?: string[];
  score?: number | null;
  categoryScores?: Record<string, number | null> | null;
  summary?: ScanSummary | null;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  website?: { id: string; name: string } | null;
  report?: { id: string } | null;
  results?: ScanResult[];
  user?: UserSummary;
}

export interface Check {
  id: string;
  key: string;
  categoryId: string;
  name: string;
  description: string;
  severity: Severity;
  weight: number;
  order: number;
  isEnabled: boolean;
  requires: "browser" | null;
  available: boolean;
  unavailableReason: string | null;
}

export interface CheckerCategory {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  isEnabled: boolean;
  checks: Check[];
}

export interface Report {
  id: string;
  scanId: string;
  userId: string;
  websiteId?: string | null;
  title: string;
  url: string;
  score: number;
  createdAt: string;
  website?: { id: string; name: string } | null;
  scan?: { id: string; summary?: ScanSummary | null; completedAt?: string | null };
  user?: UserSummary;
}

export interface ReportDetail extends Omit<Report, "scan" | "user"> {
  user: { name: string; email: string; company?: string | null };
  scan: Scan & { results: ScanResult[] };
  categories: Pick<CheckerCategory, "key" | "name" | "description" | "icon">[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  createdAt: string;
  user?: UserSummary;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  level: LogLevel;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: UserSummary | null;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: EmailStatus;
  error?: string | null;
  createdAt: string;
}

export interface DashboardData {
  stats: { websites: number; totalScans: number; activeScans: number; averageScore: number | null; issuesFound: number };
  scoreTrend: { date: string; score: number }[];
  recentScans: Pick<Scan, "id" | "url" | "status" | "score" | "progress" | "createdAt">[];
  plan: Plan | null;
  usage: Usage;
}

export interface GeneralSettings {
  siteName: string;
  supportEmail: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
}

export interface AuditSettings {
  requestTimeoutMs: number;
  maxLinksToCheck: number;
  maxRedirects: number;
  slowTtfbMs: number;
  maxPageSizeKb: number;
  sslExpiryWarningDays: number;
}

export interface BrowserDevice {
  name: string;
  width: number;
  height: number;
}

export interface BrowserSettings {
  provider: "none" | "playwright" | "browserless";
  endpoint: string;
  browsers: string[];
  devices: BrowserDevice[];
}

export interface AppSettings {
  general: GeneralSettings;
  audit: AuditSettings;
  browser: BrowserSettings;
}
