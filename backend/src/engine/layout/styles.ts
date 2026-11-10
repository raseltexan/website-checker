import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import type { CrawledPage, ScanContext } from "../context.js";
import { collectRootVariables, isTrackedProp, parseDeclarations, parseStylesheet, specificity, splitTopLevel, toPx, type CssRule } from "./css.js";

/** [top, right, bottom, left] in px; null = unknown/layout-dependent. */
export type Sides = [number | null, number | null, number | null, number | null];

export interface ResolvedBox {
  el: Element;
  tag: string;
  /** Human-readable selector-ish label, e.g. `section.hero.py-20`. */
  desc: string;
  /** Component identity: tag + sorted class list. */
  signature: string;
  padding: Sides;
  margin: Sides;
  marginAutoX: boolean;
  rowGap: number | null;
  columnGap: number | null;
  maxWidth: number | null;
  /** Spacing came from an inline style attribute. */
  inline: boolean;
}

export interface PageLayout {
  url: string;
  path: string;
  $: CheerioAPI;
  boxes: Map<Element, ResolvedBox>;
  stylesheets: number;
  failedStylesheets: string[];
  tailwind: boolean;
}

const LONGHANDS = ["padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom", "margin-left", "row-gap", "column-gap", "max-width", "display"] as const;
type Longhand = (typeof LONGHANDS)[number];

const SKIP_TAGS = new Set(["script", "style", "noscript", "template", "link", "meta", "br", "wbr", "path", "g", "defs", "use", "circle", "rect", "line", "polyline", "polygon", "ellipse", "stop", "lineargradient", "radialgradient", "clippath", "mask", "symbol", "title", "desc", "source", "track", "option"]);
const MAX_ELEMENTS_PER_PAGE = 4000;
const MAX_STYLESHEETS_PER_PAGE = 25;

/** Selectors that only apply in an interaction state or to pseudo-elements. */
const STATEFUL_SELECTOR = /::|:(?:hover|focus|focus-visible|focus-within|active|visited|target|checked|disabled|enabled|invalid|valid|placeholder-shown|placeholder|before|after|first-line|first-letter|selection|marker|backdrop|open|popover-open|-webkit-|-moz-|-ms-)/i;

const SIDES = ["top", "right", "bottom", "left"] as const;

/** Expands shorthands into the longhands the analysis tracks (LTR writing mode). */
const expand = (prop: string, value: string): [Longhand, string][] => {
  const parts = splitTopLevel(value, /\s/);
  const box = (base: "padding" | "margin"): [Longhand, string][] => {
    const [t, r = t, b = t, l = r] = parts;
    return t === undefined ? [] : ([[`${base}-top`, t], [`${base}-right`, r], [`${base}-bottom`, b], [`${base}-left`, l]] as [Longhand, string][]);
  };
  const pair = (a: Longhand, b: Longhand): [Longhand, string][] => {
    const [x, y = x] = parts;
    return x === undefined ? [] : [[a, x], [b, y]];
  };
  switch (prop) {
    case "padding":
    case "margin":
      return box(prop);
    case "padding-inline":
    case "margin-inline":
      return pair(`${prop.split("-")[0]}-left` as Longhand, `${prop.split("-")[0]}-right` as Longhand);
    case "padding-block":
    case "margin-block":
      return pair(`${prop.split("-")[0]}-top` as Longhand, `${prop.split("-")[0]}-bottom` as Longhand);
    case "gap":
    case "grid-gap":
      return pair("row-gap", "column-gap");
    case "grid-row-gap":
      return [["row-gap", value]];
    case "grid-column-gap":
      return [["column-gap", value]];
    default: {
      const logical = /^(padding|margin)-(inline|block)-(start|end)$/.exec(prop);
      if (logical) {
        const side = logical[2] === "inline" ? (logical[3] === "start" ? "left" : "right") : logical[3] === "start" ? "top" : "bottom";
        return [[`${logical[1]}-${side}` as Longhand, value]];
      }
      return (LONGHANDS as readonly string[]).includes(prop) ? [[prop as Longhand, value]] : [];
    }
  }
};

// ---------------------------------------------------------------------------
// Tailwind utilities — used as a fallback when a value can't be resolved from CSS
// (e.g. stylesheet failed to load, or values hidden behind unresolvable vars).
// ---------------------------------------------------------------------------

const TW_BREAKPOINTS = ["sm", "md", "lg", "xl"]; // all ≤ 1280px, so they apply at the analysed viewport
const TW_MAX_W: Record<string, number> = {
  "3xs": 256, "2xs": 288, xs: 320, sm: 384, md: 448, lg: 512, xl: 576, "2xl": 672, "3xl": 768, "4xl": 896, "5xl": 1024, "6xl": 1152, "7xl": 1280,
  prose: 1040, "screen-sm": 640, "screen-md": 768, "screen-lg": 1024, "screen-xl": 1280, "screen-2xl": 1536,
};
const TW_SPACING = /^(-?)(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-(.+)$/;
const TW_TARGETS: Record<string, Longhand[]> = {
  p: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  px: ["padding-left", "padding-right"], py: ["padding-top", "padding-bottom"],
  pt: ["padding-top"], pr: ["padding-right"], pb: ["padding-bottom"], pl: ["padding-left"], ps: ["padding-left"], pe: ["padding-right"],
  m: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  mx: ["margin-left", "margin-right"], my: ["margin-top", "margin-bottom"],
  mt: ["margin-top"], mr: ["margin-right"], mb: ["margin-bottom"], ml: ["margin-left"], ms: ["margin-left"], me: ["margin-right"],
  gap: ["row-gap", "column-gap"], "gap-x": ["column-gap"], "gap-y": ["row-gap"], "space-x": ["column-gap"], "space-y": ["row-gap"],
};

const twLength = (token: string) => {
  if (token === "px") return "1px";
  if (token === "auto") return "auto";
  if (/^\d+(?:\.\d+)?$/.test(token)) return `${Number(token) * 0.25}rem`;
  const arbitrary = /^\[(.+)\]$/.exec(token);
  return arbitrary ? arbitrary[1]!.replace(/_/g, " ") : null;
};

/** Values implied by Tailwind classes, ordered so responsive variants override base ones. */
const tailwindValues = (classes: string[]) => {
  const out = new Map<Longhand, string>();
  const ranked: { rank: number; prop: Longhand; value: string }[] = [];
  for (const cls of classes) {
    const segments = cls.split(":");
    const utility = segments.pop()!.replace(/^!|!$/g, "");
    if (!segments.every((v) => TW_BREAKPOINTS.includes(v))) continue;
    const rank = Math.max(0, ...segments.map((v) => TW_BREAKPOINTS.indexOf(v) + 1));
    const spacing = TW_SPACING.exec(utility);
    if (spacing) {
      const len = twLength(spacing[3]!);
      if (!len) continue;
      const value = spacing[1] && len !== "auto" ? `-${len}` : len;
      for (const prop of TW_TARGETS[spacing[2]!] ?? []) ranked.push({ rank, prop, value });
      continue;
    }
    if (utility === "hidden") ranked.push({ rank, prop: "display", value: "none" });
    else if (/^(?:block|flex|grid|inline|inline-block|inline-flex|inline-grid|table|contents|flow-root)$/.test(utility)) ranked.push({ rank, prop: "display", value: utility });
    if (utility === "container") ranked.push({ rank, prop: "max-width", value: "1280px" });
    const maxW = /^max-w-(.+)$/.exec(utility);
    if (maxW) {
      const key = maxW[1]!;
      const arbitrary = /^\[(.+)\]$/.exec(key);
      const value = arbitrary ? arbitrary[1]! : TW_MAX_W[key] ? `${TW_MAX_W[key]}px` : "none";
      ranked.push({ rank, prop: "max-width", value });
    }
  }
  ranked.sort((a, b) => a.rank - b.rank).forEach((r) => out.set(r.prop, r.value));
  return out;
};

// ---------------------------------------------------------------------------
// Stylesheet loading (shared across the crawled pages of one scan)
// ---------------------------------------------------------------------------

interface ParsedSheet {
  rules: CssRule[];
  raw: string;
}

const sheetCache = new WeakMap<ScanContext, Map<string, Promise<ParsedSheet | null>>>();

const loadSheet = (ctx: ScanContext, url: string, depth = 0): Promise<ParsedSheet | null> => {
  let cache = sheetCache.get(ctx);
  if (!cache) sheetCache.set(ctx, (cache = new Map()));
  if (!cache.has(url)) {
    cache.set(
      url,
      (async () => {
        const res = await ctx.fetchText(url);
        if (!res || res.status >= 400 || !res.body) return null;
        const parsed = parseStylesheet(res.body, 0);
        // Inline one level of @import so frameworks that split their CSS still resolve.
        const imported = depth < 1 ? await Promise.all(parsed.imports.slice(0, 5).map((i) => loadSheet(ctx, new URL(i, res.url).toString(), depth + 1))) : [];
        const rules = [...imported.flatMap((s) => s?.rules ?? []), ...parsed.rules].map((r, order) => ({ ...r, order }));
        return { rules, raw: res.body };
      })(),
    );
  }
  return cache.get(url)!;
};

const unescapeCss = (s: string) => s.replace(/\\(.)/g, "$1");

/** Rightmost compound selector's id / class / tag — used to skip rules that can't match the page. */
const rightmostKey = (selector: string) => {
  const last = splitTopLevel(selector, /[\s>+~]/).at(-1) ?? "";
  const id = /#((?:\\.|[\w-])+)/.exec(last);
  if (id) return `#${unescapeCss(id[1]!)}`;
  const cls = /\.((?:\\.|[\w-])+)/.exec(last);
  if (cls) return `.${unescapeCss(cls[1]!)}`;
  const tag = /^([a-z][\w-]*)/i.exec(last);
  return tag ? tag[1]!.toLowerCase() : "*";
};

const describe = (tag: string, id: string | undefined, classes: string[]) =>
  `${tag}${id ? `#${id}` : ""}${classes.slice(0, 3).map((c) => `.${c}`).join("")}`.slice(0, 90);

interface Winner {
  value: string;
  rank: number;
}

/** Resolves padding / margin / gap / max-width for every element of a crawled page. */
export const resolvePage = async (ctx: ScanContext, page: CrawledPage): Promise<PageLayout> => {
  const { $ } = page;
  const failedStylesheets: string[] = [];

  // 1. Collect stylesheets in document order.
  const sources: Promise<ParsedSheet | null>[] = [];
  $('link[rel~="stylesheet"][href], style').each((_, node) => {
    if (sources.length >= MAX_STYLESHEETS_PER_PAGE) return;
    const el = $(node);
    if (node.tagName === "style") {
      sources.push(Promise.resolve({ rules: parseStylesheet(el.text(), 0).rules, raw: el.text() }));
      return;
    }
    const media = el.attr("media");
    if (media && !/screen|all/i.test(media) && /print|speech/i.test(media)) return;
    try {
      const href = new URL(el.attr("href")!, page.url).toString();
      sources.push(
        loadSheet(ctx, href).then((sheet) => {
          if (!sheet) failedStylesheets.push(href);
          return sheet;
        }),
      );
    } catch {
      /* invalid href */
    }
  });
  const sheets = await Promise.all(sources);

  const allRules: CssRule[] = [];
  sheets.forEach((sheet, index) => sheet?.rules.forEach((r) => allRules.push({ ...r, order: index * 1_000_000 + r.order })));
  const vars = collectRootVariables(allRules);
  const tailwind = sheets.some((s) => s && /--tw-|tailwindcss/.test(s.raw.slice(0, 200_000)));

  // 2. Elements to analyse and the identifiers present on the page.
  const elements: Element[] = [];
  const present = new Set<string>(["*"]);
  $("body, body *").each((_, node) => {
    if (elements.length >= MAX_ELEMENTS_PER_PAGE) return false;
    const tag = node.tagName?.toLowerCase();
    if (!tag || SKIP_TAGS.has(tag) || $(node).closest("svg").length && tag !== "svg") return;
    elements.push(node);
    present.add(tag);
    const id = node.attribs.id;
    if (id) present.add(`#${id}`);
    for (const c of (node.attribs.class ?? "").split(/\s+/)) if (c) present.add(`.${c}`);
    return;
  });
  const eligible = new Set(elements);
  const winners = new Map<Element, Map<Longhand, Winner>>();

  const apply = (el: Element, prop: string, value: string, rank: number) => {
    for (const [longhand, v] of expand(prop, value)) {
      let map = winners.get(el);
      if (!map) winners.set(el, (map = new Map()));
      const current = map.get(longhand);
      if (!current || rank >= current.rank) map.set(longhand, { value: v, rank });
    }
  };

  // 3. Match stylesheet rules (only those that touch spacing).
  for (const rule of allRules) {
    const decls = rule.decls.filter((d) => isTrackedProp(d.prop));
    if (!decls.length) continue;
    for (const selector of rule.selectors) {
      if (STATEFUL_SELECTOR.test(selector) || !present.has(rightmostKey(selector))) continue;
      let matched: Element[];
      try {
        matched = $(selector).toArray() as Element[];
      } catch {
        continue; // selector syntax cheerio doesn't support
      }
      if (!matched.length) continue;
      const spec = specificity(selector);
      for (const el of matched) {
        if (!eligible.has(el)) continue;
        // rank: !important > specificity > source order
        for (const d of decls) apply(el, d.prop, d.value, (d.important ? 1e15 : 0) + spec * 1e7 + rule.order / 1e3);
      }
    }
  }

  // 4. Inline styles win over stylesheet rules (except !important ones).
  const inlineEls = new Set<Element>();
  for (const el of elements) {
    const style = el.attribs.style;
    if (!style) continue;
    for (const d of parseDeclarations(style)) {
      if (!isTrackedProp(d.prop)) continue;
      inlineEls.add(el);
      apply(el, d.prop, d.value, (d.important ? 2e15 : 1e14));
    }
  }

  // 5. Build resolved boxes, skipping elements hidden at the analysed viewport (and their subtrees).
  const boxes = new Map<Element, ResolvedBox>();
  const hidden = new Set<Element>();
  for (const el of elements) {
    const parent = el.parent as Element | null;
    if (parent && hidden.has(parent)) {
      hidden.add(el);
      continue;
    }
    const classList = (el.attribs.class ?? "").split(/\s+/).filter(Boolean);
    const twDisplay = tailwind || !sheets.some(Boolean) ? tailwindValues(classList).get("display") : undefined;
    const display = winners.get(el)?.get("display")?.value ?? twDisplay;
    if (el.attribs.hidden !== undefined || el.attribs["aria-hidden"] === "true" || display?.trim().toLowerCase() === "none") {
      hidden.add(el);
      continue;
    }
    const tag = el.tagName.toLowerCase();
    const classes = (el.attribs.class ?? "").split(/\s+/).filter(Boolean);
    const css = winners.get(el);
    const tw = tailwind || !sheets.some(Boolean) ? tailwindValues(classes) : new Map<Longhand, string>();
    const raw = (prop: Longhand) => css?.get(prop)?.value ?? tw.get(prop);
    const length = (prop: Longhand) => {
      const fromCss = css?.get(prop)?.value;
      const px = fromCss === undefined ? null : toPx(fromCss, vars);
      if (px !== null) return px;
      const fromTw = tw.get(prop);
      return fromTw === undefined ? null : toPx(fromTw, vars);
    };
    const sides = (base: "padding" | "margin") => SIDES.map((s) => length(`${base}-${s}`)) as Sides;
    boxes.set(el, {
      el,
      tag,
      desc: describe(tag, el.attribs.id, classes),
      signature: `${tag}.${[...classes].sort().slice(0, 8).join(".")}`,
      padding: sides("padding"),
      margin: sides("margin"),
      marginAutoX: raw("margin-left") === "auto" && raw("margin-right") === "auto",
      rowGap: length("row-gap"),
      columnGap: length("column-gap"),
      maxWidth: length("max-width"),
      inline: inlineEls.has(el),
    });
  }

  const u = new URL(page.url);
  return { url: page.url, path: u.pathname + u.search, $, boxes, stylesheets: sheets.filter(Boolean).length, failedStylesheets, tailwind };
};
