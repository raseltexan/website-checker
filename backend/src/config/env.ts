import "dotenv/config";
import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default(process.env.VERCEL ? "production" : "development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),
  CLIENT_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default("Administrator"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: boolish.default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("Texan Website Checker <no-reply@example.com>"),
  SCAN_USER_AGENT: z.string().default("TexanWebsiteChecker/1.0"),
  SCAN_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(3),
  DNS_SERVERS: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const configuredClientOrigins = parsed.data.CLIENT_URL.split(",").map((origin) => {
  try {
    const url = new URL(origin.trim());
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.origin;
  } catch {
    console.error("Invalid environment configuration: CLIENT_URL must be a comma-separated list of http(s) origins");
    process.exit(1);
  }
});

const clientOrigins = [
  ...new Set([
    ...configuredClientOrigins,
    "https://frontend-ashen-two-66.vercel.app",
  ]),
];

export const env = {
  ...parsed.data,
  isProduction: Boolean(process.env.VERCEL) || parsed.data.NODE_ENV === "production",
  clientOrigins,
  smtpConfigured: Boolean(parsed.data.SMTP_HOST),
  dnsServers: parsed.data.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean),
};
