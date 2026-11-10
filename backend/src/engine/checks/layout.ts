import { fail, pass, warn, type CheckDefinition, type CheckOutcome } from "../types.js";
import {
  analyzeLayout,
  asymmetricHorizontalPadding,
  componentVariances,
  fmtSides,
  isOnScale,
  majority,
  nearDuplicates,
  px,
  siblingInconsistencies,
  type LayoutAnalysis,
} from "../layout/analysis.js";
import type { ScanContext } from "../context.js";

const category = "layout";

/**
 * Padding & spacing consistency across the whole site. These checks are mandatory:
 * they run on every scan and cannot be deselected or disabled by an admin.
 *
 * Every check shares one analysis (see engine/layout): internal pages are crawled,
 * the CSS cascade is approximated at a 1280px desktop viewport, and the padding /
 * margin / gap each element receives is compared within and across pages.
 */
const layoutCheck = (
  key: string,
  name: string,
  description: string,
  severity: CheckDefinition["severity"],
  weight: number,
  evaluate: (a: LayoutAnalysis) => CheckOutcome,
): CheckDefinition => ({
  key: `${category}.${key}`,
  categoryKey: category,
  name,
  description,
  severity,
  weight,
  mandatory: true,
  run: async (ctx: ScanContext) => {
    const analysis = await analyzeLayout(ctx);
    if (analysis.limitation) return warn(analysis.limitation, { pagesAnalyzed: analysis.pagePaths, stylesheetsNotLoaded: analysis.failedStylesheets });
    if (!analysis.styledElements) return pass(`No custom padding, margin or gap is applied on the ${pagesLabel(analysis)} analysed — nothing can be inconsistent`, { pagesAnalyzed: analysis.pagePaths });
    const outcome = evaluate(analysis);
    return {
      ...outcome,
      details: {
        pagesAnalyzed: analysis.pagePaths,
        ...(analysis.failedStylesheets.length ? { stylesheetsNotLoaded: analysis.failedStylesheets.slice(0, 10) } : {}),
        ...outcome.details,
      },
    };
  },
});

const pagesLabel = (a: LayoutAnalysis) => `${a.pages.length} page${a.pages.length === 1 ? "" : "s"}`;

export const layoutChecks: CheckDefinition[] = [
  layoutCheck(
    "spacing-scale",
    "Spacing scale adherence",
    "Padding, margins and gaps on every crawled page follow a consistent 4px/8px spacing scale.",
    "HIGH",
    3,
    (a) => {
      if (!a.usages.length) return warn("No padding, margin or gap values could be resolved");
      const off = a.usages.filter((u) => !isOnScale(u.value));
      const share = 1 - off.length / a.usages.length;
      const grouped = new Map<number, { uses: number; kinds: Set<string>; examples: string[] }>();
      for (const u of off) {
        const g = grouped.get(u.value) ?? { uses: 0, kinds: new Set(), examples: [] };
        g.uses++;
        g.kinds.add(u.kind);
        if (g.examples.length < 3) g.examples.push(u.example);
        grouped.set(u.value, g);
      }
      const offScale = [...grouped]
        .sort((x, y) => y[1].uses - x[1].uses)
        .slice(0, 15)
        .map(([value, g]) => ({ value: px(value), uses: g.uses, properties: [...g.kinds], examples: g.examples }));
      const pct = Math.round(share * 100);
      const details = { onScalePercent: pct, spacingRulesAnalysed: a.usages.length, offScaleValues: offScale };
      const score = pct;
      if (share >= 0.95) return { ...pass(`${pct}% of spacing values across ${pagesLabel(a)} sit on the 4px scale`, details), score: Math.max(score, 90) };
      const msg = `${off.length} spacing value(s) are off the 4px scale (${pct}% consistent across ${pagesLabel(a)}), e.g. ${offScale.slice(0, 3).map((o) => o.value).join(", ")}`;
      return { ...(share >= 0.85 ? warn : fail)(msg, details), score };
    },
  ),
  layoutCheck(
    "spacing-tokens",
    "Spacing value consistency",
    "The site uses a small, deliberate set of spacing values instead of many near-identical ones (e.g. 15px vs 16px).",
    "MEDIUM",
    2,
    (a) => {
      const { distinct, pairs } = nearDuplicates(a.usages.map((u) => u.value));
      const usesOf = (v: number) => a.usages.filter((u) => Math.round(u.value * 2) / 2 === v);
      const nearDupes = pairs.slice(0, 12).map(([x, y]) => ({
        values: `${px(x)} vs ${px(y)}`,
        examples: [usesOf(x)[0]?.example, usesOf(y)[0]?.example].filter(Boolean),
      }));
      const details = { distinctValues: distinct.length, values: distinct.map((v) => px(v)), nearDuplicates: nearDupes };
      const summary = `${distinct.length} distinct spacing values, ${pairs.length} near-duplicate pair(s)`;
      if (pairs.length >= 8 || distinct.length > 40) return fail(`Inconsistent spacing: ${summary}`, details);
      if (pairs.length >= 3 || distinct.length > 28) return warn(`Spacing could be tightened: ${summary}`, details);
      return pass(`Consistent spacing palette: ${summary}`, details);
    },
  ),
  layoutCheck(
    "component-spacing",
    "Repeated element spacing",
    "Repeated elements (cards, list items, buttons, nav links) use identical padding and gaps on every page.",
    "HIGH",
    3,
    (a) => {
      const siblings = siblingInconsistencies(a.pages);
      const variances = componentVariances(a.pages);
      const inline = a.pages.flatMap((p) => [...p.boxes.values()].filter((b) => b.inline).map((b) => `${p.path} → ${b.desc}`));
      const issues = siblings.length + variances.length;
      const details = {
        inconsistentSiblingGroups: siblings.slice(0, 15),
        componentsWithPaddingVariants: variances.slice(0, 15),
        inlineSpacingStyles: { count: inline.length, examples: inline.slice(0, 10) },
      };
      const inlineNote = inline.length > 10 ? `; ${inline.length} elements hard-code spacing in inline styles` : "";
      if (!issues) {
        return inline.length > 10
          ? warn(`Repeated elements are consistent${inlineNote}`, details)
          : pass(`Repeated elements share consistent spacing across ${pagesLabel(a)}`, details);
      }
      const msg = `${siblings.length} group(s) of repeated elements and ${variances.length} component(s) have mismatched padding/margins${inlineNote}`;
      return (issues > 3 ? fail : warn)(msg, details);
    },
  ),
  layoutCheck(
    "section-rhythm",
    "Section padding rhythm",
    "Page sections use a consistent vertical padding rhythm, and the header/footer spacing is identical on every page.",
    "HIGH",
    3,
    (a) => {
      const content = a.sections.filter((s) => s.role === "content" && (s.top !== null || s.bottom !== null));
      const vertical = content.flatMap((s) => [s.top, s.bottom]).filter((v): v is number => v !== null && v > 0);
      const { distinct } = majority(vertical.map((v) => Math.round(v)));
      const asymmetric = content
        .filter((s) => s.top !== null && s.bottom !== null && s.top > 0 && s.bottom > 0 && Math.min(s.top, s.bottom) / Math.max(s.top, s.bottom) < 0.75)
        .map((s) => ({ page: s.page, section: s.box.desc, top: px(s.top), bottom: px(s.bottom) }));

      // Header & footer must be identical across pages (shared template).
      const templateOutliers: { region: string; page: string; spacing: string; expected: string }[] = [];
      for (const role of ["header", "footer"] as const) {
        const regions = a.sections.filter((s) => s.role === role);
        const sig = (s: (typeof regions)[number]) => `padding ${fmtSides(s.box.padding)}, inset ${px(s.insetLeft)}/${px(s.insetRight)}`;
        const { value: expected } = majority(regions.map(sig));
        for (const s of regions) if (sig(s) !== expected) templateOutliers.push({ region: role, page: s.page, spacing: sig(s), expected: expected ?? "" });
      }

      const sectionPaddings = [...distinct].sort((x, y) => y[1] - x[1]).map(([v, count]) => ({ value: `${v}px`, sections: count }));
      const details = { sectionsAnalysed: content.length, verticalPaddingValues: sectionPaddings, asymmetricSections: asymmetric.slice(0, 15), templateOutliers: templateOutliers.slice(0, 15) };
      const problems = [
        distinct.size > 3 && `${distinct.size} different section padding values (${sectionPaddings.slice(0, 5).map((p) => p.value).join(", ")})`,
        asymmetric.length > 0 && `${asymmetric.length} section(s) with unbalanced top/bottom padding`,
        templateOutliers.length > 0 && `header/footer spacing differs on ${new Set(templateOutliers.map((o) => o.page)).size} page(s)`,
      ].filter(Boolean);
      if (!content.length && !templateOutliers.length) return pass("Pages have no padded sections to compare — nothing is inconsistent", details);
      if (!problems.length) return pass(`Sections follow a consistent vertical rhythm across ${pagesLabel(a)}`, details);
      const severe = distinct.size > 5 || templateOutliers.length >= 2 || asymmetric.length > 4;
      return (severe ? fail : warn)(`Section spacing is inconsistent: ${problems.join("; ")}`, details);
    },
  ),
  layoutCheck(
    "alignment",
    "Content alignment",
    "Sections share the same content width and horizontal insets so edges line up, and no element has lopsided left/right padding.",
    "HIGH",
    3,
    (a) => {
      const aligned = a.sections.filter((s) => s.container || (s.insetLeft ?? 0) > 0 || (s.insetRight ?? 0) > 0);
      const sig = (s: (typeof aligned)[number]) => `max-width ${s.container?.maxWidth ? px(s.container.maxWidth) : "none"}, inset ${px(s.insetLeft)} / ${px(s.insetRight)}`;
      // Sections of the same page should share one content edge.
      const misaligned: { page: string; section: string; layout: string; expected: string }[] = [];
      const layoutsPerPage: Record<string, number> = {};
      for (const path of a.pagePaths) {
        const onPage = aligned.filter((s) => s.page === path);
        if (onPage.length < 2) continue;
        const { value: expected, distinct } = majority(onPage.map(sig));
        layoutsPerPage[path] = distinct.size;
        for (const s of onPage) if (sig(s) !== expected) misaligned.push({ page: path, section: s.box.desc, layout: sig(s), expected: expected ?? "" });
      }
      const asymmetric = asymmetricHorizontalPadding(a.pages);
      const maxLayouts = Math.max(1, ...Object.values(layoutsPerPage));
      const details = {
        sectionsAnalysed: aligned.length,
        containerLayoutsPerPage: layoutsPerPage,
        misalignedSections: misaligned.slice(0, 15),
        asymmetricPadding: asymmetric.slice(0, 15),
      };
      if (!aligned.length && !asymmetric.length) return pass("Pages have no content containers to compare — nothing is misaligned", details);
      const problems = [
        misaligned.length > 0 && `${misaligned.length} section(s) don't line up with the content edge of their page`,
        asymmetric.length > 0 && `${asymmetric.length} element(s) with unequal left/right padding`,
      ].filter(Boolean);
      if (!problems.length) return pass(`All sections share one content edge across ${pagesLabel(a)}`, details);
      const severe = maxLayouts > 3 || misaligned.length > 4 || asymmetric.length > 10;
      return (severe ? fail : warn)(`Alignment issues: ${problems.join("; ")}`, details);
    },
  ),
];
