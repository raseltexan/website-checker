import { fail, pass, warn, type CheckDefinition } from "../types.js";

const category = "security";

const headerCheck = (
  key: string,
  name: string,
  header: string,
  description: string,
  severity: CheckDefinition["severity"],
  evaluate?: (value: string) => ReturnType<typeof pass>,
): CheckDefinition => ({
  key,
  categoryKey: category,
  name,
  description,
  severity,
  weight: severity === "HIGH" ? 3 : 2,
  run: async (ctx) => {
    const value = (await ctx.page()).headers.get(header);
    if (!value) return fail(`${header} header is missing`);
    return evaluate ? evaluate(value) : pass(`${header} is set`, { value });
  },
});

export const securityChecks: CheckDefinition[] = [
  {
    key: "security.https",
    categoryKey: category,
    name: "HTTPS enforcement",
    description: "Site is served over HTTPS and HTTP requests redirect to HTTPS.",
    severity: "CRITICAL",
    weight: 4,
    run: async (ctx) => {
      const page = await ctx.page();
      if (!page.finalUrl.startsWith("https://")) return fail("Site is not served over HTTPS", { finalUrl: page.finalUrl });
      const httpUrl = page.finalUrl.replace(/^https:/, "http:");
      try {
        const { finalUrl } = await ctx.follow(httpUrl, { method: "HEAD" });
        if (!finalUrl.startsWith("https://")) return warn("HTTP version does not redirect to HTTPS", { httpUrl });
      } catch {
        // HTTP port closed is acceptable — HTTPS is the only entry point.
      }
      return pass("Site is served over HTTPS");
    },
  },
  headerCheck("security.hsts", "HSTS", "strict-transport-security", "Strict-Transport-Security header forces HTTPS.", "HIGH", (value) => {
    const maxAge = Number(value.match(/max-age=(\d+)/i)?.[1] ?? 0);
    if (maxAge < 15552000) return warn(`HSTS max-age is low (${maxAge}s); recommend ≥ 6 months`, { value });
    return pass("HSTS is configured", { value });
  }),
  headerCheck("security.csp", "Content Security Policy", "content-security-policy", "A Content-Security-Policy header restricts resource origins.", "HIGH", (value) =>
    /unsafe-inline|unsafe-eval/.test(value) ? warn("CSP allows unsafe-inline or unsafe-eval", { value }) : pass("CSP is configured", { value }),
  ),
  {
    key: "security.clickjacking",
    categoryKey: category,
    name: "Clickjacking protection",
    description: "X-Frame-Options or CSP frame-ancestors prevents framing.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const h = (await ctx.page()).headers;
      const xfo = h.get("x-frame-options");
      const frameAncestors = h.get("content-security-policy")?.includes("frame-ancestors");
      return xfo || frameAncestors ? pass("Framing is restricted", { xFrameOptions: xfo }) : fail("No X-Frame-Options or frame-ancestors directive");
    },
  },
  headerCheck("security.content-type-options", "X-Content-Type-Options", "x-content-type-options", "Prevents MIME type sniffing (nosniff).", "MEDIUM", (value) =>
    value.toLowerCase() === "nosniff" ? pass("nosniff is set") : warn(`Unexpected value "${value}"`),
  ),
  headerCheck("security.referrer-policy", "Referrer-Policy", "referrer-policy", "Controls how much referrer information is shared.", "LOW"),
  headerCheck("security.permissions-policy", "Permissions-Policy", "permissions-policy", "Restricts access to browser features like camera and geolocation.", "LOW"),
  {
    key: "security.mixed-content",
    categoryKey: category,
    name: "Mixed content",
    description: "HTTPS page does not load resources over insecure HTTP.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const page = await ctx.page();
      if (!page.finalUrl.startsWith("https://")) return warn("Page is not HTTPS; mixed content not applicable");
      const $ = await ctx.$();
      const insecure = $("script[src], link[rel=stylesheet][href], img[src], iframe[src], source[src], video[src], audio[src]")
        .map((_, el) => $(el).attr("src") ?? $(el).attr("href"))
        .get()
        .filter((u): u is string => typeof u === "string" && u.startsWith("http://"));
      return insecure.length ? fail(`${insecure.length} insecure resource(s) loaded over HTTP`, { resources: insecure.slice(0, 20) }) : pass("No mixed content detected");
    },
  },
  {
    key: "security.server-disclosure",
    categoryKey: category,
    name: "Server information disclosure",
    description: "Server and X-Powered-By headers do not reveal software versions.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const h = (await ctx.page()).headers;
      const leaks = [h.get("server"), h.get("x-powered-by"), h.get("x-aspnet-version")].filter((v): v is string => Boolean(v && /\d/.test(v)));
      return leaks.length ? warn("Headers disclose software versions", { values: leaks }) : pass("No version information disclosed");
    },
  },
  {
    key: "security.cookies",
    categoryKey: category,
    name: "Cookie security flags",
    description: "Cookies set Secure, HttpOnly and SameSite attributes.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const cookies = (await ctx.page()).setCookies;
      if (!cookies.length) return pass("No cookies set on the landing page");
      const weak = cookies
        .map((c) => ({
          name: c.split("=")[0],
          missing: [["Secure", /;\s*secure/i], ["HttpOnly", /;\s*httponly/i], ["SameSite", /;\s*samesite=/i]]
            .filter(([, re]) => !(re as RegExp).test(c))
            .map(([flag]) => flag as string),
        }))
        .filter((c) => c.missing.length);
      return weak.length ? warn(`${weak.length} of ${cookies.length} cookie(s) lack security flags`, { cookies: weak }) : pass("All cookies have security flags");
    },
  },
];
