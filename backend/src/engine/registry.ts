import type { CategoryDefinition, CheckDefinition } from "./types.js";
import { seoChecks } from "./checks/seo.js";
import { securityChecks } from "./checks/security.js";
import { sslChecks } from "./checks/ssl.js";
import { performanceChecks } from "./checks/performance.js";
import { accessibilityChecks } from "./checks/accessibility.js";
import { contentChecks } from "./checks/content.js";
import { technicalChecks } from "./checks/technical.js";
import { dnsChecks } from "./checks/dns.js";
import { browserChecks } from "./checks/browser.js";
import { layoutChecks } from "./checks/layout.js";

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { key: "seo", name: "SEO", description: "On-page search engine optimisation signals.", icon: "search", order: 1 },
  { key: "performance", name: "Performance", description: "Server response, payload size and loading behaviour.", icon: "gauge", order: 2 },
  { key: "security", name: "Security Headers", description: "HTTPS enforcement and protective HTTP headers.", icon: "shield", order: 3 },
  { key: "ssl", name: "SSL / TLS", description: "Certificate trust, expiry and protocol strength.", icon: "lock", order: 4 },
  { key: "accessibility", name: "Accessibility", description: "WCAG-oriented markup checks.", icon: "accessibility", order: 5 },
  { key: "content", name: "Links & Content", description: "Broken links, content depth and site assets.", icon: "link", order: 6 },
  { key: "technical", name: "Mobile & Technical", description: "Status codes, redirects, viewport and markup basics.", icon: "smartphone", order: 7 },
  { key: "dns", name: "Email & DNS", description: "DNS resolution and email authentication records.", icon: "mail", order: 8 },
  { key: "browser", name: "Browser & Device", description: "Responsive layout, browser compatibility and resource loading.", icon: "monitor", order: 9 },
  { key: "layout", name: "Layout & Spacing", description: "Padding, margin, gap and alignment consistency across every page.", icon: "layout", order: 10 },
];

export const CHECK_DEFINITIONS: CheckDefinition[] = [
  ...seoChecks,
  ...performanceChecks,
  ...securityChecks,
  ...sslChecks,
  ...accessibilityChecks,
  ...contentChecks,
  ...technicalChecks,
  ...dnsChecks,
  ...browserChecks,
  ...layoutChecks,
];

export const CHECKS_BY_KEY = new Map(CHECK_DEFINITIONS.map((c) => [c.key, c]));

/** Checks that run on every scan regardless of the user's selection. */
export const MANDATORY_CHECK_KEYS = CHECK_DEFINITIONS.filter((c) => c.mandatory).map((c) => c.key);
export const MANDATORY_CATEGORY_KEYS = [...new Set(CHECK_DEFINITIONS.filter((c) => c.mandatory).map((c) => c.categoryKey))];
