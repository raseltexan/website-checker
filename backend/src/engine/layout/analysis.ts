import type { Element } from "domhandler";
import type { ScanContext } from "../context.js";
import { VIEWPORT_WIDTH } from "./css.js";
import { resolvePage, type PageLayout, type ResolvedBox, type Sides } from "./styles.js";

/**
 * Site-wide spacing analysis shared by every layout check of a scan.
 * Crawls internal pages, approximates the CSS cascade at a desktop viewport and
 * collects the padding / margin / gap values each element ends up with.
 */

export type SpacingKind = "padding" | "margin" | "gap";

export interface SpacingUsage {
  value: number;
  kind: SpacingKind;
  /** Where it was first seen, e.g. `/about → div.card`. */
  example: string;
  pages: Set<string>;
}

export interface Section {
  page: string;
  box: ResolvedBox;
  role: "header" | "footer" | "nav" | "content";
  /** Effective vertical padding (section + its first wrapper). */
  top: number | null;
  bottom: number | null;
  /** Content container (max-width / centred wrapper) inside the section. */
  container: ResolvedBox | null;
  insetLeft: number | null;
  insetRight: number | null;
}

export interface LayoutAnalysis {
  pages: PageLayout[];
  pagePaths: string[];
  usages: SpacingUsage[];
  sections: Section[];
  /** Total elements with at least one resolved spacing value. */
  styledElements: number;
  failedStylesheets: string[];
  /** Set when the static HTML/CSS didn't contain enough to analyse. */
  limitation: string | null;
}

const MAX_SPACING_PX = 400; // larger values are layout offsets, not spacing

const cache = new WeakMap<ScanContext, Promise<LayoutAnalysis>>();

export const analyzeLayout = (ctx: ScanContext) => {
  if (!cache.has(ctx)) cache.set(ctx, buildAnalysis(ctx));
  return cache.get(ctx)!;
};

const fmt = (v: number | null) => (v === null ? "?" : `${Math.round(v * 10) / 10}px`);
export const fmtSides = (s: Sides) => s.map(fmt).join(" ");
export const px = fmt;

const elementChildren = (el: Element) => el.children.filter((c): c is Element => "tagName" in c && typeof c.tagName === "string");

const roleOf = (box: ResolvedBox): Section["role"] => {
  const el = box.el;
  const hint = `${box.tag} ${el.attribs.class ?? ""} ${el.attribs.id ?? ""} ${el.attribs.role ?? ""}`.toLowerCase();
  if (box.tag === "header" || /\b(?:site-)?header\b|\bbanner\b|\btopbar\b|\bnavbar\b/.test(hint)) return "header";
  if (box.tag === "footer" || /\b(?:site-)?footer\b|\bcontentinfo\b/.test(hint)) return "footer";
  if (box.tag === "nav" || /\bnavigation\b/.test(hint)) return "nav";
  return "content";
};

/** Top-level page sections: children of the content root, of <main>, and outermost <section>s. */
const findSections = (page: PageLayout): Section[] => {
  const { $, boxes } = page;
  const body = $("body").get(0) as Element | undefined;
  if (!body) return [];
  let root: Element = body;
  // Descend through single-child app wrappers such as #__next or #root.
  for (let i = 0; i < 4; i++) {
    const kids: Element[] = elementChildren(root).filter((c) => boxes.has(c));
    if (kids.length === 1 && ["div", "main"].includes(kids[0]!.tagName.toLowerCase())) root = kids[0]!;
    else break;
  }
  const candidates = new Set<Element>();
  for (const child of elementChildren(root)) {
    if (!boxes.has(child)) continue;
    if (child.tagName.toLowerCase() === "main") elementChildren(child).forEach((c) => boxes.has(c) && candidates.add(c));
    else candidates.add(child);
  }
  $("section").each((_, s) => {
    if (boxes.has(s as Element) && !$(s).parents("section").length) candidates.add(s as Element);
  });
  // Drop candidates nested inside another candidate.
  const list = [...candidates].filter((el) => !$(el).parents().toArray().some((p) => candidates.has(p as Element)));

  return list.flatMap((el) => {
    const box = boxes.get(el)!;
    if ($(el).text().trim().length < 2 && !$(el).find("img, svg, video, picture").length) return [];
    const firstWrapper = elementChildren(el).map((c) => boxes.get(c)).find((b) => b && !["h1", "h2", "h3", "p", "a", "img", "span"].includes(b.tag));
    const add = (a: number | null, b: number | null | undefined) => (a === null && (b === null || b === undefined) ? null : (a ?? 0) + (b ?? 0));
    const top = add(box.padding[0], firstWrapper?.padding[0]);
    const bottom = add(box.padding[2], firstWrapper?.padding[2]);

    // Content container: closest descendant (≤3 levels) that constrains width or is centred.
    let container: ResolvedBox | null = box.maxWidth !== null || box.marginAutoX ? box : null;
    let frontier = [el];
    for (let depth = 0; depth < 3 && !container; depth++) {
      frontier = frontier.flatMap(elementChildren).filter((c) => boxes.has(c));
      container = frontier.map((c) => boxes.get(c)!).find((b) => (b.maxWidth !== null && b.maxWidth < VIEWPORT_WIDTH * 1.5) || b.marginAutoX) ?? null;
    }
    const inner = container && container !== box ? container : null;
    return [
      {
        page: page.path,
        box,
        role: roleOf(box),
        top,
        bottom,
        container,
        insetLeft: add(box.padding[3], inner?.padding[3]),
        insetRight: add(box.padding[1], inner?.padding[1]),
      },
    ];
  });
};

const buildAnalysis = async (ctx: ScanContext): Promise<LayoutAnalysis> => {
  const crawled = await ctx.crawl();
  const pages: PageLayout[] = [];
  for (const page of crawled) pages.push(await resolvePage(ctx, page)); // sequential: resolution is CPU-bound

  const usages = new Map<string, SpacingUsage>();
  let styledElements = 0;
  const record = (page: PageLayout, box: ResolvedBox, kind: SpacingKind, value: number | null) => {
    if (value === null) return;
    const v = Math.abs(value);
    if (v === 0 || v > MAX_SPACING_PX) return;
    const rounded = Math.round(v * 100) / 100;
    // One usage per component signature + property + value (so 100 identical list items count once).
    const key = `${box.signature}|${kind}|${rounded}`;
    const existing = usages.get(key);
    if (existing) existing.pages.add(page.path);
    else usages.set(key, { value: rounded, kind, example: `${page.path} → ${box.desc}`, pages: new Set([page.path]) });
  };

  for (const page of pages) {
    for (const box of page.boxes.values()) {
      const values = [...box.padding, ...box.margin, box.rowGap, box.columnGap];
      if (values.some((v) => v !== null && v !== 0)) styledElements++;
      box.padding.forEach((v) => record(page, box, "padding", v));
      box.margin.forEach((v) => record(page, box, "margin", v));
      record(page, box, "gap", box.rowGap);
      record(page, box, "gap", box.columnGap);
    }
  }

  const failedStylesheets = [...new Set(pages.flatMap((p) => p.failedStylesheets))];
  let limitation: string | null = null;
  const clientRendered = pages.every((p) => p.boxes.size < 15 && p.$("script[src]").length > 0 && p.$("body").text().trim().length < 40);
  if (clientRendered) limitation = "The pages contain almost no server-rendered markup (likely a client-rendered app), so spacing can't be analysed from the HTML.";
  else if (!styledElements && failedStylesheets.length) limitation = "The site's stylesheets could not be loaded, so spacing can't be analysed.";

  return {
    pages,
    pagePaths: pages.map((p) => p.path),
    usages: [...usages.values()],
    sections: pages.flatMap(findSections),
    styledElements,
    failedStylesheets,
    limitation,
  };
};

// ---------------------------------------------------------------------------
// Helpers used by the individual checks
// ---------------------------------------------------------------------------

/** On the spacing scale: multiples of 4px, plus 2px steps below 16px; hairlines (≤2px) are fine. */
export const isOnScale = (v: number) => {
  const n = Math.abs(v);
  if (n <= 2) return true;
  if (Math.abs(n - Math.round(n)) > 0.05) return false;
  const r = Math.round(n);
  return r % 4 === 0 || (r < 16 && r % 2 === 0);
};

/** Distinct values that are suspiciously close (e.g. 15px vs 16px, 30px vs 32px). */
export const nearDuplicates = (values: number[]) => {
  const sorted = [...new Set(values.map((v) => Math.round(v * 2) / 2))].sort((a, b) => a - b);
  const pairs: [number, number][] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    if (a >= 6 && b - a <= 2 && (b - a) / b <= 0.12) pairs.push([a, b]);
  }
  return { distinct: sorted, pairs };
};

export interface SiblingInconsistency {
  page: string;
  parent: string;
  item: string;
  count: number;
  variants: string[];
}

/** Repeated siblings (cards, list items, nav links…) whose spacing differs from one another. */
export const siblingInconsistencies = (pages: PageLayout[]) => {
  const out: SiblingInconsistency[] = [];
  for (const page of pages) {
    for (const parentBox of page.boxes.values()) {
      const groups = new Map<string, ResolvedBox[]>();
      for (const child of elementChildren(parentBox.el)) {
        const box = page.boxes.get(child);
        if (!box) continue;
        const list = groups.get(box.signature) ?? [];
        list.push(box);
        groups.set(box.signature, list);
      }
      for (const members of groups.values()) {
        if (members.length < 3) continue;
        const padding = new Set(members.map((m) => fmtSides(m.padding)));
        // First/last items often drop a trailing margin on purpose — compare the middle ones.
        const middle = members.slice(1, -1);
        const margin = new Set(middle.map((m) => fmtSides(m.margin)));
        if (padding.size > 1 || margin.size > 1) {
          out.push({
            page: page.path,
            parent: parentBox.desc,
            item: members[0]!.desc,
            count: members.length,
            variants: [...(padding.size > 1 ? [...padding].map((p) => `padding ${p}`) : []), ...(margin.size > 1 ? [...margin].map((m) => `margin ${m}`) : [])].slice(0, 6),
          });
        }
      }
    }
  }
  return out;
};

export interface ComponentVariance {
  component: string;
  variants: { padding: string; seenOn: string[] }[];
}

/** The same component (identical class list) rendered with different padding in different places. */
export const componentVariances = (pages: PageLayout[]) => {
  const bySignature = new Map<string, { desc: string; variants: Map<string, Set<string>> }>();
  for (const page of pages) {
    for (const box of page.boxes.values()) {
      if (!box.signature.includes(".") || box.signature.endsWith(".")) continue; // needs at least one class
      if (box.padding.every((v) => v === null || v === 0)) continue;
      const entry = bySignature.get(box.signature) ?? { desc: box.desc, variants: new Map() };
      const key = fmtSides(box.padding);
      entry.variants.set(key, (entry.variants.get(key) ?? new Set()).add(page.path));
      bySignature.set(box.signature, entry);
    }
  }
  const out: ComponentVariance[] = [];
  for (const { desc, variants } of bySignature.values()) {
    if (variants.size < 2) continue;
    out.push({ component: desc, variants: [...variants].slice(0, 4).map(([padding, seen]) => ({ padding, seenOn: [...seen].slice(0, 5) })) });
  }
  return out;
};

/** Elements with left/right padding that differ — content is visually off-centre. */
export const asymmetricHorizontalPadding = (pages: PageLayout[]) => {
  const out: { page: string; element: string; left: string; right: string }[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    for (const box of page.boxes.values()) {
      // Form controls commonly reserve space for an icon on one side.
      if (["input", "select", "textarea"].includes(box.tag)) continue;
      const [, right, , left] = box.padding;
      if (left === null || right === null || left <= 0 || right <= 0 || Math.abs(left - right) <= 4) continue;
      const key = `${box.signature}|${left}|${right}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ page: page.path, element: box.desc, left: fmt(left), right: fmt(right) });
    }
  }
  return out;
};

/** Most common value of a list (ties: first seen). */
export const majority = <T>(items: T[]) => {
  const counts = new Map<T, number>();
  items.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1));
  let best: T | undefined;
  let bestCount = 0;
  for (const [item, count] of counts) if (count > bestCount) [best, bestCount] = [item, count];
  return { value: best, count: bestCount, distinct: counts };
};
