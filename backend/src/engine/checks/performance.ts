import { fail, pass, unavailable, warn, type CheckDefinition } from "../types.js";

const category = "performance";

export const performanceChecks: CheckDefinition[] = [
  {
    key: "performance.ttfb",
    categoryKey: category,
    name: "Server response time",
    description: "Time to first byte (including redirects) from the scanner.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const { ttfbMs } = await ctx.page();
      const limit = ctx.settings.slowTtfbMs;
      const details = { ttfbMs, thresholdMs: limit };
      if (ttfbMs > limit * 2) return fail(`Slow response: ${ttfbMs} ms`, details);
      if (ttfbMs > limit) return warn(`Response time could be improved: ${ttfbMs} ms`, details);
      return pass(`Fast response: ${ttfbMs} ms`, details);
    },
  },
  {
    key: "performance.page-size",
    categoryKey: category,
    name: "HTML document size",
    description: "HTML payload is within a reasonable size.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const kb = Math.round((await ctx.page()).bytes / 1024);
      const limit = ctx.settings.maxPageSizeKb;
      if (kb > limit) return fail(`HTML is ${kb} KB (limit ${limit} KB)`, { kb });
      if (kb > limit / 3) return warn(`HTML is fairly large: ${kb} KB`, { kb });
      return pass(`HTML size is ${kb} KB`, { kb });
    },
  },
  {
    key: "performance.compression",
    categoryKey: category,
    name: "Text compression",
    description: "HTML is served with gzip, brotli or zstd compression.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const enc = (await ctx.page()).headers.get("content-encoding");
      return enc && /(gzip|br|zstd|deflate)/i.test(enc) ? pass(`Compressed with ${enc}`) : fail("Response is not compressed");
    },
  },
  {
    key: "performance.caching",
    categoryKey: category,
    name: "Cache headers",
    description: "Response includes Cache-Control or ETag/Last-Modified validators.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const h = (await ctx.page()).headers;
      const cacheControl = h.get("cache-control");
      const validators = Boolean(h.get("etag") || h.get("last-modified"));
      if (!cacheControl && !validators) return warn("No caching headers present");
      return pass("Caching headers are present", { cacheControl, etag: h.get("etag") });
    },
  },
  {
    key: "performance.resource-count",
    categoryKey: category,
    name: "Resource count",
    description: "Number of scripts, stylesheets and images referenced by the HTML.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const $ = await ctx.$();
      const counts = { scripts: $("script[src]").length, stylesheets: $('link[rel="stylesheet"]').length, images: $("img").length };
      const total = counts.scripts + counts.stylesheets + counts.images;
      if (total > 150) return fail(`${total} resources referenced`, counts);
      if (total > 80) return warn(`${total} resources referenced`, counts);
      return pass(`${total} resources referenced`, counts);
    },
  },
  {
    key: "performance.render-blocking",
    categoryKey: category,
    name: "Render-blocking scripts",
    description: "Scripts in <head> use async, defer or type=module.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      const blocking = $("head script[src]")
        .filter((_, el) => !$(el).is("[async], [defer], [type=module]"))
        .map((_, el) => $(el).attr("src"))
        .get();
      if (blocking.length > 3) return fail(`${blocking.length} render-blocking scripts in <head>`, { scripts: blocking });
      if (blocking.length) return warn(`${blocking.length} render-blocking script(s) in <head>`, { scripts: blocking });
      return pass("No render-blocking scripts in <head>");
    },
  },
  {
    key: "performance.images",
    categoryKey: category,
    name: "Image optimisation",
    description: "Images declare dimensions and below-the-fold images lazy-load.",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const $ = await ctx.$();
      const imgs = $("img");
      if (!imgs.length) return pass("No images on the page");
      const noDims = imgs.filter((_, el) => !$(el).attr("width") || !$(el).attr("height")).length;
      const lazy = imgs.filter((_, el) => $(el).attr("loading") === "lazy").length;
      const details = { images: imgs.length, missingDimensions: noDims, lazyLoaded: lazy };
      if (imgs.length > 5 && lazy === 0) return warn("No images use lazy loading", details);
      if (noDims > imgs.length / 2) return warn(`${noDims} image(s) lack width/height attributes`, details);
      return pass("Images look well configured", details);
    },
  },
  {
    key: "performance.core-web-vitals",
    categoryKey: category,
    name: "Core Web Vitals (LCP, CLS, INP)",
    description: "Lab measurement of Core Web Vitals in a real browser.",
    severity: "HIGH",
    weight: 3,
    requires: "browser",
    run: async () => unavailable("Core Web Vitals measurement is not implemented for this browser provider yet"),
  },
];
