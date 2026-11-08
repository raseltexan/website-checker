import { Resolver } from "node:dns/promises";
import { env } from "../../config/env.js";
import { fail, pass, warn, type CheckDefinition } from "../types.js";

const category = "dns";

/** Dedicated resolver; DNS_SERVERS overrides the OS resolver (useful in containers). */
const resolver = new Resolver({ timeout: 5000, tries: 2 });
if (env.dnsServers.length) resolver.setServers(env.dnsServers);

/** Codes meaning "the name/record does not exist" — anything else is a lookup failure. */
const NO_RECORDS = new Set(["ENODATA", "ENOTFOUND", "ENONAME"]);

/**
 * Runs a DNS query, returning [] when no records exist. Resolver failures (refused,
 * timeout, …) are thrown so the runner records ERROR instead of a false FAIL.
 */
const query = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
  try {
    return await fn();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "";
    if (NO_RECORDS.has(code)) return [];
    throw new Error(`DNS lookup failed (${code || "unknown error"}); check the server's DNS configuration`);
  }
};

/** Strips a leading "www." so email records are looked up on the apex. */
const apex = (host: string) => host.replace(/^www\./i, "");
const txt = async (name: string) => (await query(() => resolver.resolveTxt(name))).map((parts) => parts.join(""));

export const dnsChecks: CheckDefinition[] = [
  {
    key: "dns.records",
    categoryKey: category,
    name: "A / AAAA records",
    description: "Domain resolves to IPv4 and ideally IPv6 addresses.",
    severity: "HIGH",
    weight: 2,
    run: async (ctx) => {
      const host = ctx.target.hostname;
      const [a, aaaa] = await Promise.all([query(() => resolver.resolve4(host)), query(() => resolver.resolve6(host))]);
      if (!a.length && !aaaa.length) return fail("Domain has no A or AAAA records");
      if (!aaaa.length) return warn("No IPv6 (AAAA) records", { a });
      return pass("IPv4 and IPv6 records found", { a, aaaa });
    },
  },
  {
    key: "dns.mx",
    categoryKey: category,
    name: "MX records",
    description: "Domain has mail exchanger records to receive email.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const mx = await query(() => resolver.resolveMx(apex(ctx.target.hostname)));
      return mx.length ? pass(`${mx.length} MX record(s)`, { mx: mx.sort((x, y) => x.priority - y.priority) }) : warn("No MX records; domain cannot receive email");
    },
  },
  {
    key: "dns.spf",
    categoryKey: category,
    name: "SPF record",
    description: "SPF TXT record authorises mail senders for the domain.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const spf = (await txt(apex(ctx.target.hostname))).filter((r) => r.toLowerCase().startsWith("v=spf1"));
      if (!spf.length) return fail("No SPF record found");
      if (spf.length > 1) return fail("Multiple SPF records found (invalid)", { records: spf });
      if (/\+all\b/.test(spf[0]!)) return fail("SPF uses +all, allowing anyone to send", { record: spf[0] });
      return pass("SPF record is configured", { record: spf[0] });
    },
  },
  {
    key: "dns.dmarc",
    categoryKey: category,
    name: "DMARC policy",
    description: "DMARC record protects the domain from spoofing.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const record = (await txt(`_dmarc.${apex(ctx.target.hostname)}`)).find((r) => r.toLowerCase().startsWith("v=dmarc1"));
      if (!record) return fail("No DMARC record found");
      const policy = record.match(/;\s*p=(\w+)/i)?.[1]?.toLowerCase();
      if (policy === "none") return warn("DMARC policy is p=none (monitoring only)", { record });
      return pass(`DMARC policy p=${policy}`, { record });
    },
  },
  {
    key: "dns.caa",
    categoryKey: category,
    name: "CAA record",
    description: "CAA record restricts which CAs may issue certificates.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const caa = await query(() => resolver.resolveCaa(apex(ctx.target.hostname)));
      return caa.length ? pass(`${caa.length} CAA record(s)`, { caa }) : warn("No CAA record");
    },
  },
];
