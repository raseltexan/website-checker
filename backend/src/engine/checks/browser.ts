import vm from "node:vm";
import { fail, pass, unavailable, warn, type CheckDefinition } from "../types.js";
import type { ScanContext } from "../context.js";
import { parseStylesheet, splitTopLevel, toPx } from "../layout/css.js";

const category = "browser";
const MOBILE_WIDTH = 390;

/**
 * Browser & device checks.
 *
 * Responsive layout, browser compatibility and resource/script errors are evaluated
 * statically from the delivered HTML and CSS, so they work without any integration.
 * Device screenshots need a real rendering engine and stay UNAVAILABLE until a
 * provider is implemented in `engine/integrations/browser.ts`.
 */

const stylesheetUrls = async (ctx: ScanContext) => {
  const $ = await ctx.$();
  const base = (await ctx.page()).finalUrl;
  return $('link[rel~="stylesheet"][href]')
    .map((_, el) => {
      try {
        return new URL($(el).attr("href")!, base).toString();
      } catch {
        return null;
      }
    })
    .get()
    .filter((u): u is string => Boolean(u))
    .slice(0, 20);
};

/** All CSS of the scanned page: linked stylesheets plus <style> blocks. */
const pageCss = async (ctx: ScanContext) => {
  const $ = await ctx.$();
  const linked = await Promise.all((await stylesheetUrls(ctx)).map((u) => ctx.fetchText(u)));
  return [...linked.map((r) => (r && r.status < 400 ? r.body : "")), ...$("style").map((_, el) => $(el).text()).get()].filter(Boolean);
};

const mapLimit = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) => {
  const results: R[] = new Array(items.length);
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]!);
      }
    }),
  );
  return results;
};

export const browserChecks: CheckDefinition[] = [
  {
    key: `${category}.cross-browser`,
    categoryKey: category,
    name: "Cross-browser compatibility",
    description: "Standards-mode doctype, declared charset and no obsolete or plugin-only markup that renders differently across browsers.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      const { html } = await ctx.page();
      const issues: string[] = [];
      if (!/^\s*(?:<!--[\s\S]*?-->\s*)*<!doctype html/i.test(html)) issues.push("Missing <!DOCTYPE html> — browsers fall back to quirks mode and lay out boxes differently");
      if (!$("meta[charset]").length && !$('meta[http-equiv="Content-Type" i]').length) issues.push("No character encoding declared (<meta charset>)");
      const obsolete = ["marquee", "blink", "center", "font", "frameset", "frame", "applet", "big", "tt", "strike"].filter((t) => $(t).length);
      if (obsolete.length) issues.push(`Obsolete elements used: ${obsolete.map((t) => `<${t}>`).join(", ")}`);
      const plugins = $('object[type*="flash" i], embed[src$=".swf" i], object[data$=".swf" i], embed[type*="flash" i]').length;
      if (plugins) issues.push(`${plugins} Flash/plugin embed(s) — unsupported by every modern browser`);
      if (/<!--\[if\s+[^\]]*IE/i.test(html)) issues.push("Internet Explorer conditional comments present");
      const vendorOnly = (await pageCss(ctx)).join("\n").match(/(?:^|[;{\s])-(?:webkit|moz|ms)-(?:box-flex|box-pack|box-align|box-ordinal-group)\s*:/g)?.length ?? 0;
      if (vendorOnly) issues.push(`${vendorOnly} legacy vendor-prefixed flexbox declaration(s) (old -webkit-box syntax)`);
      if (!issues.length) return pass("Markup is standards-compliant across modern browsers (static analysis)");
      const critical = issues.some((i) => i.startsWith("Missing <!DOCTYPE") || i.includes("Flash"));
      return (critical ? fail : warn)(`${issues.length} cross-browser compatibility issue(s)`, { issues });
    },
  },
  {
    key: `${category}.responsive`,
    categoryKey: category,
    name: "Responsive layout",
    description: "Mobile viewport is configured, layouts adapt with media queries, and no fixed-width elements overflow a 390px phone screen.",
    severity: "HIGH",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      const issues: string[] = [];
      const viewport = $('meta[name="viewport"]').attr("content") ?? "";
      if (!/width\s*=\s*device-width/i.test(viewport)) issues.push("No <meta name=\"viewport\" content=\"width=device-width\"> — phones render a zoomed-out desktop page");
      if (/user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*1(?:\.0)?\b/i.test(viewport)) issues.push("Viewport disables pinch-zoom");

      const css = await pageCss(ctx);
      const hasMediaQueries = css.some((c) => /@media[^{]*(?:min|max)-width|@media[^{]*width\s*[<>]/i.test(c)) || /\bclass="[^"]*\b(?:sm|md|lg|xl):/i.test((await ctx.page()).html);
      // A short single-column page can be responsive without media queries.
      if (!hasMediaQueries && $("body *").length > 80) issues.push("No width-based media queries found — the layout doesn't adapt to screen size");

      // Fixed widths wider than a phone, in rules that still apply at mobile width and match page elements.
      const fixed: { selector: string; width: string }[] = [];
      const check = (selector: string, prop: string, value: string) => {
        if (!/^(?:min-)?width$/.test(prop)) return;
        const px = toPx(value, new Map());
        if (px === null || px <= MOBILE_WIDTH + 30) return;
        try {
          if ($(selector).length) fixed.push({ selector: selector.slice(0, 80), width: `${prop}: ${value}` });
        } catch {
          /* unsupported selector */
        }
      };
      for (const source of css) {
        for (const rule of parseStylesheet(source, 0, MOBILE_WIDTH).rules) {
          for (const d of rule.decls) for (const s of rule.selectors) if (!/:(?:hover|focus|active)|::/.test(s)) check(s, d.prop, d.value);
          if (fixed.length > 30) break;
        }
      }
      $("[style]").each((_, el) => {
        for (const part of splitTopLevel($(el).attr("style") ?? "", ";")) {
          const [prop = "", value = ""] = part.split(/:(.*)/s).map((x) => x.trim());
          if (/^(?:min-)?width$/i.test(prop)) {
            const px = toPx(value, new Map());
            if (px !== null && px > MOBILE_WIDTH + 30) fixed.push({ selector: `<${el.tagName} style>`, width: `${prop}: ${value}` });
          }
        }
      });
      if (fixed.length) issues.push(`${fixed.length} element(s) have a fixed width wider than a ${MOBILE_WIDTH}px phone and will cause horizontal scrolling`);

      const details = { viewport: viewport || null, mediaQueries: hasMediaQueries, fixedWidthElements: fixed.slice(0, 20) };
      if (!issues.length) return pass("Page is configured for responsive rendering on phones, tablets and desktops", details);
      const severe = issues.some((i) => i.startsWith("No <meta")) || fixed.length > 5;
      return (severe ? fail : warn)(`${issues.length} responsive layout issue(s)`, { issues, ...details });
    },
  },
  {
    key: `${category}.console-errors`,
    categoryKey: category,
    name: "JavaScript & resource errors",
    description: "Scripts and stylesheets load successfully, there is no mixed content, and inline scripts are free of syntax errors.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      const page = await ctx.page();
      const base = page.finalUrl;
      const resources = [
        ...$("script[src]").map((_, el) => ({ type: "script", src: $(el).attr("src")! })).get(),
        ...$('link[rel~="stylesheet"][href]').map((_, el) => ({ type: "stylesheet", src: $(el).attr("href")! })).get(),
      ]
        .map((r) => {
          try {
            return { ...r, url: new URL(r.src, base).toString() };
          } catch {
            return null;
          }
        })
        .filter((r): r is { type: string; src: string; url: string } => Boolean(r))
        .slice(0, 40);

      const statuses = await mapLimit(resources, 6, async (r) => ({ ...r, status: await ctx.probe(r.url) }));
      const failed = statuses.filter((s) => s.status === null || s.status >= 400).map((s) => ({ type: s.type, url: s.url, status: s.status ?? "unreachable" }));

      const mixed = base.startsWith("https:")
        ? $("script[src], link[rel~=stylesheet][href], img[src], iframe[src], video[src], audio[src], source[src]")
            .map((_, el) => $(el).attr("src") ?? $(el).attr("href"))
            .get()
            .filter((u) => /^http:\/\//i.test(u))
        : [];

      const syntaxErrors: { script: number; error: string }[] = [];
      $("script:not([src])").each((i, el) => {
        const type = ($(el).attr("type") ?? "").toLowerCase();
        if (type && !/^(?:text|application)\/(?:java|ecma)script$/.test(type)) return; // modules, JSON, templates
        const code = $(el).text();
        if (!code.trim()) return;
        try {
          new vm.Script(code); // compiles only — never executes
        } catch (error) {
          syntaxErrors.push({ script: i + 1, error: error instanceof Error ? error.message : String(error) });
        }
      });

      const details = { resourcesChecked: resources.length, failedResources: failed, mixedContent: mixed.slice(0, 20), inlineScriptErrors: syntaxErrors.slice(0, 10) };
      const problems = [
        failed.length && `${failed.length} script/stylesheet request(s) failed`,
        mixed.length && `${mixed.length} insecure http:// resource(s) blocked as mixed content`,
        syntaxErrors.length && `${syntaxErrors.length} inline script(s) with syntax errors`,
      ].filter(Boolean);
      if (!problems.length) return pass(`All ${resources.length} scripts and stylesheets load without errors`, details);
      return (failed.some((f) => f.type === "script") || syntaxErrors.length ? fail : warn)(problems.join("; "), details);
    },
  },
  {
    key: `${category}.screenshots`,
    categoryKey: category,
    name: "Device screenshots",
    description: "Captures screenshots for each configured device.",
    severity: "LOW",
    weight: 2,
    requires: "browser",
    run: async () => unavailable("Device screenshots are not implemented for this browser provider yet"),
  },
];
