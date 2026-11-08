const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const relFmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatDate = (value?: string | Date | null) => (value ? dateFmt.format(new Date(value)) : "—");
export const formatDateTime = (value?: string | Date | null) => (value ? dateTimeFmt.format(new Date(value)) : "—");

export const timeAgo = (value?: string | Date | null) => {
  if (!value) return "—";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return relFmt.format(Math.round(seconds / size), unit);
  return "just now";
};

export const formatPrice = (cents: number) =>
  cents === 0 ? "Free" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

export const formatLimit = (value: number) => (value < 0 ? "Unlimited" : value.toLocaleString());

export const formatDuration = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(" ");
};

export const hostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/** Traffic-light tone for a 0–100 score. */
export const scoreTone = (score?: number | null) => {
  if (score === null || score === undefined) return "neutral" as const;
  if (score >= 80) return "success" as const;
  if (score >= 50) return "warning" as const;
  return "danger" as const;
};

export const initials = (name?: string | null) =>
  (name ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Shortens a user agent string to "Browser on OS". */
export const describeUserAgent = (ua?: string | null) => {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
};
