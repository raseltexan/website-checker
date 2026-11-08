import { fail, pass, unavailable, warn, type CheckDefinition } from "../types.js";

const category = "accessibility";

const GENERIC_LINK_TEXT = new Set(["click here", "here", "read more", "more", "link", "learn more"]);

export const accessibilityChecks: CheckDefinition[] = [
  {
    key: "accessibility.html-lang",
    categoryKey: category,
    name: "Document language",
    description: "<html> declares a lang attribute for screen readers.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const lang = (await ctx.$())("html").attr("lang");
      return lang ? pass(`Language declared: ${lang}`) : fail("<html> has no lang attribute");
    },
  },
  {
    key: "accessibility.image-alt",
    categoryKey: category,
    name: "Image alt text",
    description: "Every <img> has an alt attribute.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const $ = await ctx.$();
      const imgs = $("img");
      const missing = imgs.filter((_, el) => $(el).attr("alt") === undefined).map((_, el) => $(el).attr("src")).get();
      if (!imgs.length) return pass("No images on the page");
      if (!missing.length) return pass(`All ${imgs.length} images have alt attributes`);
      return (missing.length / imgs.length > 0.25 ? fail : warn)(`${missing.length} of ${imgs.length} images lack alt text`, { images: missing.slice(0, 20) });
    },
  },
  {
    key: "accessibility.form-labels",
    categoryKey: category,
    name: "Form labels",
    description: "Form inputs have an associated label or aria-label.",
    severity: "HIGH",
    weight: 3,
    run: async (ctx) => {
      const $ = await ctx.$();
      const inputs = $("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea");
      const unlabeled = inputs.filter((_, el) => {
        const id = $(el).attr("id");
        return !$(el).attr("aria-label") && !$(el).attr("aria-labelledby") && !$(el).closest("label").length && !(id && $(`label[for="${id}"]`).length);
      }).length;
      if (!inputs.length) return pass("No form fields on the page");
      return unlabeled ? fail(`${unlabeled} of ${inputs.length} form field(s) have no label`) : pass("All form fields are labelled");
    },
  },
  {
    key: "accessibility.heading-order",
    categoryKey: category,
    name: "Heading hierarchy",
    description: "Heading levels do not skip (e.g. H2 → H4).",
    severity: "LOW",
    weight: 1,
    run: async (ctx) => {
      const $ = await ctx.$();
      const levels = $("h1, h2, h3, h4, h5, h6").map((_, el) => Number(el.tagName.slice(1))).get();
      const skips = levels.filter((lvl, i) => i > 0 && lvl - (levels[i - 1] ?? lvl) > 1).length;
      if (!levels.length) return warn("No headings found");
      return skips ? warn(`Heading levels skip ${skips} time(s)`, { sequence: levels.slice(0, 40) }) : pass("Heading hierarchy is sequential");
    },
  },
  {
    key: "accessibility.link-text",
    categoryKey: category,
    name: "Descriptive link text",
    description: "Links have accessible, descriptive text.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      let empty = 0;
      let generic = 0;
      $("a[href]").each((_, el) => {
        const text = ($(el).text().trim() || $(el).attr("aria-label") || $(el).find("img[alt]").attr("alt") || "").toLowerCase();
        if (!text) empty++;
        else if (GENERIC_LINK_TEXT.has(text)) generic++;
      });
      if (empty) return fail(`${empty} link(s) have no accessible text`, { empty, generic });
      if (generic) return warn(`${generic} link(s) use generic text like "click here"`, { generic });
      return pass("Links have descriptive text");
    },
  },
  {
    key: "accessibility.button-names",
    categoryKey: category,
    name: "Button names",
    description: "Buttons have accessible names.",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const $ = await ctx.$();
      const unnamed = $("button, [role=button]").filter((_, el) => !$(el).text().trim() && !$(el).attr("aria-label") && !$(el).attr("title")).length;
      return unnamed ? fail(`${unnamed} button(s) have no accessible name`) : pass("All buttons have accessible names");
    },
  },
  {
    key: "accessibility.zoom",
    categoryKey: category,
    name: "Zoom allowed",
    description: "Viewport does not disable pinch-zoom (user-scalable=no / maximum-scale=1).",
    severity: "MEDIUM",
    weight: 2,
    run: async (ctx) => {
      const content = (await ctx.$())('meta[name="viewport"]').attr("content")?.toLowerCase() ?? "";
      const blocked = /user-scalable\s*=\s*(no|0)/.test(content) || /maximum-scale\s*=\s*1(\.0)?\b/.test(content);
      return blocked ? fail("Viewport disables zooming", { content }) : pass("Users can zoom the page");
    },
  },
  {
    key: "accessibility.color-contrast",
    categoryKey: category,
    name: "Color contrast",
    description: "Text meets WCAG AA contrast ratios (requires rendered page).",
    severity: "MEDIUM",
    weight: 2,
    requires: "browser",
    run: async () => unavailable("Color contrast analysis is not implemented for this browser provider yet"),
  },
];
