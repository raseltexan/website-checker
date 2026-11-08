import { fail, pass, warn, type CheckDefinition } from "../types.js";

const category = "seo";

const lengthCheck = (value: string, min: number, max: number, label: string) => {
  if (!value) return fail(`No ${label} found`);
  const details = { value, length: value.length, recommended: `${min}–${max} characters` };
  if (value.length < min) return warn(`${label} is short (${value.length} chars)`, details);
  if (value.length > max) return warn(`${label} is long (${value.length} chars) and may be truncated`, details);
  return pass(`${label} length is good (${value.length} chars)`, details);
};

export const seoChecks: CheckDefinition[] = [
  {
    key: "seo.title",
    categoryKey: category,
    name: "Title tag",
    description: "Page has a descriptive <title> of a search-friendly length.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => lengthCheck((await ctx.$())("head > title").first().text().trim(), 10, 60, "Title"),
  },
  {
    key: "seo.meta-description",
    categoryKey: category,
    name: "Meta description",
    description: "Page has a meta description between 50 and 160 characters.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => lengthCheck((await ctx.$())('meta[name="description"]').attr("content")?.trim() ?? "", 50, 160, "Meta description"),
  },
  {
    key: "seo.h1",
    categoryKey: category,
    name: "H1 heading",
    description: "Page has exactly one H1 heading.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      const h1s = $("h1").map((_, el) => $(el).text().trim()).get();
      if (h1s.length === 0) return fail("No H1 heading found");
      if (h1s.length > 1) return warn(`Found ${h1s.length} H1 headings; use a single H1`, { headings: h1s.slice(0, 10) });
      return pass("Exactly one H1 heading", { heading: h1s[0] });
    },
  },
  {
    key: "seo.canonical",
    categoryKey: category,
    name: "Canonical URL",
    description: "Page declares a canonical URL to prevent duplicate content.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const href = (await ctx.$())('link[rel="canonical"]').attr("href");
      if (!href) return warn("No canonical link element found");
      try {
        const canonical = new URL(href, (await ctx.page()).finalUrl).toString();
        return pass("Canonical URL is declared", { canonical });
      } catch {
        return fail("Canonical URL is invalid", { href });
      }
    },
  },
  {
    key: "seo.indexability",
    categoryKey: category,
    name: "Indexability",
    description: "Page is not blocked from search engines by meta robots or X-Robots-Tag.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const page = await ctx.page();
      const meta = (await ctx.$())('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
      const header = page.headers.get("x-robots-tag")?.toLowerCase() ?? "";
      if (meta.includes("noindex") || header.includes("noindex")) return fail("Page is set to noindex", { meta, header });
      return pass("Page can be indexed", { meta: meta || null, header: header || null });
    },
  },
  {
    key: "seo.robots-txt",
    categoryKey: category,
    name: "robots.txt",
    description: "A robots.txt file is available at the site root.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const res = await ctx.resource("/robots.txt");
      if (!res || res.status !== 200) return warn("robots.txt not found", { status: res?.status ?? null });
      const blocksAll = /^\s*disallow:\s*\/\s*$/im.test(res.body) && /^\s*user-agent:\s*\*\s*$/im.test(res.body);
      if (blocksAll) return warn("robots.txt may block all crawlers (Disallow: /)");
      return pass("robots.txt is available", { size: res.body.length });
    },
  },
  {
    key: "seo.sitemap",
    categoryKey: category,
    name: "XML sitemap",
    description: "An XML sitemap is discoverable via robots.txt or /sitemap.xml.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const robots = await ctx.resource("/robots.txt");
      const declared = robots?.body.match(/^\s*sitemap:\s*(\S+)/im)?.[1];
      const res = await ctx.resource(declared ?? "/sitemap.xml");
      if (res?.status === 200 && /<(urlset|sitemapindex)/i.test(res.body)) {
        return pass("XML sitemap found", { url: declared ?? "/sitemap.xml", urls: (res.body.match(/<loc>/gi) ?? []).length });
      }
      return warn("No XML sitemap found", { checked: declared ?? "/sitemap.xml" });
    },
  },
  {
    key: "seo.open-graph",
    categoryKey: category,
    name: "Open Graph tags",
    description: "og:title, og:description and og:image are present for social sharing.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const $ = await ctx.$();
      const tags = ["og:title", "og:description", "og:image"];
      const missing = tags.filter((t) => !$(`meta[property="${t}"]`).attr("content"));
      if (missing.length === tags.length) return fail("No Open Graph tags found");
      if (missing.length) return warn(`Missing Open Graph tags: ${missing.join(", ")}`, { missing });
      return pass("Open Graph tags are present");
    },
  },
  {
    key: "seo.twitter-card",
    categoryKey: category,
    name: "Twitter card",
    description: "twitter:card meta tag is defined.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const card = (await ctx.$())('meta[name="twitter:card"]').attr("content");
      return card ? pass(`Twitter card type: ${card}`) : warn("No twitter:card meta tag");
    },
  },
  {
    key: "seo.structured-data",
    categoryKey: category,
    name: "Structured data",
    description: "Valid JSON-LD structured data is present.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const $ = await ctx.$();
      const blocks = $('script[type="application/ld+json"]').map((_, el) => $(el).text()).get();
      if (!blocks.length) return warn("No JSON-LD structured data found");
      const types: string[] = [];
      let invalid = 0;
      for (const block of blocks) {
        try {
          const json = JSON.parse(block) as unknown;
          for (const item of [json].flat() as { "@type"?: string }[]) if (item?.["@type"]) types.push(String(item["@type"]));
        } catch {
          invalid++;
        }
      }
      if (invalid) return fail(`${invalid} of ${blocks.length} JSON-LD blocks are invalid JSON`, { types });
      return pass(`Found ${blocks.length} JSON-LD block(s)`, { types });
    },
  },
];
