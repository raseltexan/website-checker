/**
 * Minimal CSS reader for the layout & spacing checks.
 *
 * It is not a full CSS engine: it extracts style rules with their media context,
 * resolves custom properties and simple calc() expressions, and converts lengths to
 * pixels. That is enough to approximate the spacing a desktop browser would apply.
 */

/** Viewport the cascade is evaluated at (a typical laptop). */
export const VIEWPORT_WIDTH = 1280;
const ROOT_FONT_PX = 16;

export interface CssDecl {
  prop: string;
  value: string;
  important: boolean;
}

export interface CssRule {
  selectors: string[];
  decls: CssDecl[];
  /** Source order across every stylesheet of a page. */
  order: number;
}

/** Properties the layout analysis cares about. */
const TRACKED_PROP =
  /^(?:(?:padding|margin)(?:-(?:top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?|gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap|max-width|display)$/;

export const isTrackedProp = (prop: string) => TRACKED_PROP.test(prop);

/** At-rules whose contents never apply to page layout. */
const SKIPPED_AT_RULE = /^@(?:-webkit-)?(?:keyframes|font-face|page|property|counter-style|font-feature-values|container|starting-style)\b/i;

/** Splits on a separator, ignoring separators nested in parentheses or quotes. */
export const splitTopLevel = (input: string, separator: string | RegExp) => {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0 && (typeof separator === "string" ? ch === separator : separator.test(ch))) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
};

export const parseDeclarations = (body: string): CssDecl[] =>
  splitTopLevel(body, ";").flatMap((chunk) => {
    const colon = chunk.indexOf(":");
    if (colon < 1) return [];
    const prop = chunk.slice(0, colon).trim().toLowerCase();
    let value = chunk.slice(colon + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, "").trim();
    return value ? [{ prop, value, important }] : [];
  });

/** Converts a media-query length to px. */
const mqPx = (n: string, unit: string) => Number(n) * (unit === "px" ? 1 : ROOT_FONT_PX);

/** Whether a media query matches a light-mode screen of the given width (desktop by default). */
export const mediaApplies = (query: string, viewport = VIEWPORT_WIDTH) => {
  const q = query.toLowerCase();
  return splitTopLevel(q, ",").some((part) => {
    if (/^\s*not\b/.test(part) || /\bprint\b/.test(part) && !/\bscreen\b/.test(part)) return false;
    if (/prefers-color-scheme\s*:\s*dark/.test(part) || /prefers-contrast\s*:\s*more/.test(part)) return false;
    if (/orientation\s*:\s*portrait/.test(part)) return false;
    for (const m of part.matchAll(/min-width\s*:\s*([\d.]+)(px|em|rem)/g)) if (mqPx(m[1]!, m[2]!) > viewport) return false;
    for (const m of part.matchAll(/max-width\s*:\s*([\d.]+)(px|em|rem)/g)) if (mqPx(m[1]!, m[2]!) < viewport) return false;
    // Range syntax used by Tailwind v4, e.g. (width >= 40rem) / (width < 64rem).
    for (const m of part.matchAll(/width\s*(>=|>|<=|<)\s*([\d.]+)(px|em|rem)/g)) {
      const px = mqPx(m[2]!, m[3]!);
      const ok = m[1] === ">=" ? viewport >= px : m[1] === ">" ? viewport > px : m[1] === "<=" ? viewport <= px : viewport < px;
      if (!ok) return false;
    }
    return true;
  });
};

/**
 * Extracts style rules that apply at the desktop viewport. Rules inside non-matching
 * @media blocks and irrelevant at-rules are dropped; nested rules are flattened.
 */
export const parseStylesheet = (source: string, startOrder: number, viewport = VIEWPORT_WIDTH) => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: CssRule[] = [];
  const imports: string[] = [];
  let order = startOrder;

  /** Walks a block body; `active` is false when an enclosing at-rule doesn't apply. */
  const walk = (text: string, active: boolean, parentSelectors: string[] | null) => {
    let i = 0;
    let buffer = "";
    let ownDecls = "";
    while (i < text.length) {
      const ch = text[i]!;
      if (ch === '"' || ch === "'") {
        const end = text.indexOf(ch, i + 1);
        const stop = end === -1 ? text.length : end + 1;
        buffer += text.slice(i, stop);
        i = stop;
        continue;
      }
      if (ch === ";") {
        const statement = buffer.trim();
        const imp = /^@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/i.exec(statement);
        if (imp) imports.push(imp[1]!);
        else if (!statement.startsWith("@")) ownDecls += `${statement};`;
        buffer = "";
        i++;
        continue;
      }
      if (ch === "{") {
        // Find the matching closing brace.
        let depth = 1;
        let j = i + 1;
        while (j < text.length && depth > 0) {
          const c = text[j]!;
          if (c === "{") depth++;
          else if (c === "}") depth--;
          j++;
        }
        const prelude = buffer.trim();
        const body = text.slice(i + 1, j - 1);
        buffer = "";
        i = j;
        if (prelude.startsWith("@")) {
          if (SKIPPED_AT_RULE.test(prelude)) continue;
          const isMedia = /^@media\b/i.test(prelude);
          walk(body, active && (!isMedia || mediaApplies(prelude.replace(/^@media/i, ""), viewport)), parentSelectors);
        } else {
          const own = splitTopLevel(prelude, ",");
          // CSS nesting: combine with the parent selector list.
          const selectors = parentSelectors
            ? parentSelectors.flatMap((p) => own.map((s) => (s.includes("&") ? s.replaceAll("&", p) : `${p} ${s}`)))
            : own;
          walk(body, active, selectors);
        }
        continue;
      }
      buffer += ch;
      i++;
    }
    ownDecls += buffer;
    if (parentSelectors && active) {
      const decls = parseDeclarations(ownDecls);
      if (decls.length) rules.push({ selectors: parentSelectors, decls, order: order++ });
    }
  };

  walk(css, true, null);
  return { rules, imports, nextOrder: order };
};

/** Custom properties declared on the document root (used to resolve var()). */
export const collectRootVariables = (rules: CssRule[]) => {
  const vars = new Map<string, string>();
  const ROOT = /^(?::root|html|:host|\*|body|\[data-theme[^\]]*\])$/;
  for (const rule of rules) {
    if (!rule.selectors.some((s) => ROOT.test(s.trim()))) continue;
    for (const d of rule.decls) if (d.prop.startsWith("--")) vars.set(d.prop, d.value);
  }
  return vars;
};

/** Replaces var(--x, fallback) with values from `vars`, repeatedly (for chained vars). */
export const substituteVars = (value: string, vars: Map<string, string>) => {
  let out = value;
  for (let pass = 0; pass < 6 && out.includes("var("); pass++) {
    out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name: string, fallback?: string) => vars.get(name) ?? fallback?.trim() ?? "__unresolved__");
  }
  return out;
};

type Quantity = { n: number; length: boolean };

/** Evaluates a calc()-style expression made of px/rem/em lengths and plain numbers. */
const evaluate = (expr: string): Quantity | null => {
  const tokens = expr.match(/-?[\d.]+(?:px|rem|em)?|[-+*/()]|\S+/g);
  if (!tokens) return null;
  let pos = 0;
  const atom = (): Quantity | null => {
    const t = tokens[pos++];
    if (t === undefined) return null;
    if (t === "(" || t === "calc(") {
      const v = sum();
      if (tokens[pos++] !== ")") return null;
      return v;
    }
    const m = /^(-?[\d.]+)(px|rem|em)?$/.exec(t);
    if (!m) return null;
    const n = Number(m[1]);
    if (Number.isNaN(n)) return null;
    return m[2] ? { n: m[2] === "px" ? n : n * ROOT_FONT_PX, length: true } : { n, length: false };
  };
  const product = (): Quantity | null => {
    let left = atom();
    while (left && (tokens[pos] === "*" || tokens[pos] === "/")) {
      const op = tokens[pos++];
      const right = atom();
      if (!right) return null;
      if (op === "*") left = { n: left.n * right.n, length: left.length || right.length };
      else if (right.n === 0 || right.length) return null;
      else left = { n: left.n / right.n, length: left.length };
    }
    return left;
  };
  const sum = (): Quantity | null => {
    let left = product();
    while (left && (tokens[pos] === "+" || tokens[pos] === "-")) {
      const op = tokens[pos++];
      const right = product();
      if (!right) return null;
      if (left.length !== right.length && left.n !== 0 && right.n !== 0) return null;
      left = { n: op === "+" ? left.n + right.n : left.n - right.n, length: left.length || right.length };
    }
    return left;
  };
  const result = sum();
  return result && pos === tokens.length ? result : null;
};

/**
 * Converts a single CSS length to px. Returns null for values that depend on layout
 * (%, vw, auto, clamp, …) and therefore can't be judged statically.
 */
export const toPx = (raw: string, vars: Map<string, string>): number | null => {
  const value = substituteVars(raw.trim(), vars).trim().toLowerCase();
  if (!value || value.includes("__unresolved__")) return null;
  if (value === "0" || value === "-0") return 0;
  const simple = /^(-?[\d.]+)(px|rem|em)$/.exec(value);
  if (simple) return Math.round(Number(simple[1]) * (simple[2] === "px" ? 1 : ROOT_FONT_PX) * 100) / 100;
  const calc = /^calc\((.*)\)$/.exec(value);
  if (calc) {
    const q = evaluate(calc[1]!.replace(/\bcalc\(/g, "("));
    if (q && (q.length || q.n === 0)) return Math.round(q.n * 100) / 100;
  }
  return null;
};

/** Specificity as a single comparable number (ids, classes/attrs/pseudo-classes, types). */
export const specificity = (selector: string) => {
  const s = selector
    .replace(/\\./g, "x") // escaped chars in class names, e.g. .md\:p-4
    .replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "") // :where() adds no specificity
    .replace(/::[\w-]+/g, "")
    .replace(/\[[^\]]*\]/g, ".attr");
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+|:[\w-]+/g) ?? []).length;
  const types = (s.replace(/[#.:][\w-]+/g, " ").match(/(?:^|[\s>+~(,])[a-z][\w-]*/gi) ?? []).length;
  return ids * 1_000_000 + classes * 1_000 + types;
};
