import { fail, pass, warn, type CheckDefinition } from "../types.js";

const category = "ssl";

export const sslChecks: CheckDefinition[] = [
  {
    key: "ssl.certificate",
    categoryKey: category,
    name: "Certificate validity",
    description: "TLS certificate is trusted and matches the hostname.",
    severity: "CRITICAL",
    weight: 4,
    run: async (ctx) => {
      const info = await ctx.tlsInfo();
      const details = { issuer: info.issuer, subject: info.subject, validTo: info.validTo };
      return info.authorized ? pass("Certificate is valid and trusted", details) : fail(`Certificate is not trusted: ${info.authorizationError}`, details);
    },
  },
  {
    key: "ssl.expiry",
    categoryKey: category,
    name: "Certificate expiry",
    description: "Certificate is not close to its expiration date.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const info = await ctx.tlsInfo();
      if (!info.validTo) return fail("Could not read certificate expiry");
      const days = Math.floor((new Date(info.validTo).getTime() - Date.now()) / 86_400_000);
      const details = { validTo: info.validTo, daysRemaining: days };
      if (days < 0) return fail("Certificate has expired", details);
      if (days < ctx.settings.sslExpiryWarningDays) return warn(`Certificate expires in ${days} day(s)`, details);
      return pass(`Certificate valid for ${days} more days`, details);
    },
  },
  {
    key: "ssl.protocol",
    categoryKey: category,
    name: "TLS protocol version",
    description: "Server negotiates TLS 1.2 or newer.",
    severity: "HIGH",
    weight: 2,
    run: async (ctx) => {
      const { protocol } = await ctx.tlsInfo();
      if (protocol === "TLSv1.3") return pass("TLS 1.3 negotiated", { protocol });
      if (protocol === "TLSv1.2") return pass("TLS 1.2 negotiated", { protocol });
      return fail(`Outdated protocol negotiated: ${protocol ?? "unknown"}`, { protocol });
    },
  },
];
