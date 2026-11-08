import { fail, pass, warn, type CheckDefinition } from "../types.js";

const category = "content";

/** Runs async tasks with bounded concurrency. */
const mapLimit = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) => {
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return results;
};

export const contentChecks: CheckDefinition[] = [
  {
    key: "content.broken-links",
    categoryKey: category,
    name: "Broken links",
    description: "Links on the page return successful HTTP responses.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const $ = await ctx.$();
      const base = (await ctx.page()).finalUrl;
      const urls = [
        ...new Set(
          $("a[href]")
            .map((_, el) => $(el).attr("href"))
            .get()
            .filter((h) => !/^(#|mailto:|tel:|javascript:|data:)/i.test(h))
            .map((h) => {
              try {
                const u = new URL(h, base);
                u.hash = "";
                return u.protocol.startsWith("http") ? u.toString() : null;
              } catch {
                return null;
              }
            })
            .filter((u): u is string => Boolean(u)),
        ),
      ];
      const sample = urls.slice(0, ctx.settings.maxLinksToCheck);
      if (!sample.length) return warn("No links found on the page");
      const statuses = await mapLimit(sample, 6, async (url) => ({ url, status: await ctx.probe(url) }));
      const broken = statuses.filter((s) => s.status === null || s.status >= 400);
      const details = { checked: sample.length, totalFound: urls.length, broken: broken.slice(0, 30) };
      if (broken.length) return (broken.length > 3 ? fail : warn)(`${broken.length} broken link(s) out of ${sample.length} checked`, details);
      return pass(`All ${sample.length} checked links are working`, details);
    },
  },
  {
    key: "content.word-count",
    categoryKey: category,
    name: "Content length",
    description: "Page has enough indexable text content.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const $ = await ctx.$();
      const body = $("body").clone();
      body.find("script, style, noscript, svg").remove();
      const words = body.text().split(/\s+/).filter(Boolean).length;
      if (words < 100) return warn(`Thin content: ${words} words`, { words });
      return pass(`${words} words of content`, { words });
    },
  },
  {
    key: "content.favicon",
    categoryKey: category,
    name: "Favicon",
    description: "Site provides a favicon.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const href = (await ctx.$())('link[rel~="icon"]').attr("href");
      if (href) return pass("Favicon is declared", { href });
      const res = await ctx.resource("/favicon.ico");
      return res?.status === 200 ? pass("Favicon found at /favicon.ico") : fail("No favicon found");
    },
  },
];
