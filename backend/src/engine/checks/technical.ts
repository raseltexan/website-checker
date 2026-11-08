import { randomUUID } from "node:crypto";
import { fail, pass, warn, type CheckDefinition } from "../types.js";

const category = "technical";

export const technicalChecks: CheckDefinition[] = [
  {
    key: "technical.http-status",
    categoryKey: category,
    name: "HTTP status",
    description: "Page responds with HTTP 200.",
    severity: "CRITICAL",
    weight: 4,
    run: async (ctx) => {
      const { status } = await ctx.page();
      if (status >= 200 && status < 300) return pass(`HTTP ${status}`);
      return fail(`Page returned HTTP ${status}`, { status });
    },
  },
  {
    key: "technical.redirects",
    categoryKey: category,
    name: "Redirect chain",
    description: "Page is reachable with at most one redirect.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const { redirects, finalUrl } = await ctx.page();
      const details = { hops: redirects, finalUrl };
      if (redirects.length > 2) return fail(`${redirects.length} redirects before reaching the page`, details);
      if (redirects.length === 2) return warn("2 redirects before reaching the page", details);
      return pass(redirects.length ? "Single redirect" : "No redirects", details);
    },
  },
  {
    key: "technical.viewport",
    categoryKey: category,
    name: "Mobile viewport",
    description: "A responsive viewport meta tag is configured.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const content = (await ctx.$())('meta[name="viewport"]').attr("content");
      if (!content) return fail("No viewport meta tag; page will not scale on mobile");
      return content.includes("width=device-width") ? pass("Responsive viewport configured", { content }) : warn("Viewport does not use width=device-width", { content });
    },
  },
  {
    key: "technical.doctype",
    categoryKey: category,
    name: "HTML5 doctype",
    description: "Document starts with <!DOCTYPE html>.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => (/^\s*<!doctype html>/i.test((await ctx.page()).html) ? pass("HTML5 doctype present") : warn("Missing or non-HTML5 doctype")),
  },
  {
    key: "technical.charset",
    categoryKey: category,
    name: "Character encoding",
    description: "UTF-8 charset is declared in headers or markup.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const header = (await ctx.page()).headers.get("content-type") ?? "";
      const meta = (await ctx.$())("meta[charset]").attr("charset") ?? "";
      return /utf-8/i.test(header + meta) ? pass("UTF-8 declared") : warn("UTF-8 charset not declared", { header, meta });
    },
  },
  {
    key: "technical.not-found",
    categoryKey: category,
    name: "404 handling",
    description: "Non-existent URLs return a real 404 status (no soft 404s).",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const res = await ctx.resource(`/__texan-check-${randomUUID()}`);
      if (!res) return warn("Could not test 404 handling");
      if (res.status === 404 || res.status === 410) return pass(`Missing pages return ${res.status}`);
      return fail(`Missing pages return HTTP ${res.status} (soft 404)`, { status: res.status });
    },
  },
];
