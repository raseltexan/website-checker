import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LinkButton } from "@/components/ui/Button";
import { CategoryIcon } from "@/lib/categoryIcons";
import type { PublicStats } from "@/types/models";

/** Shown until live stats arrive (or if the API is unreachable). */
const FALLBACK_CATEGORIES: PublicStats["categoryList"] = [
  { key: "seo", icon: "search", name: "SEO", description: "Titles, meta, canonical, sitemaps, structured data.", checks: 0 },
  { key: "performance", icon: "gauge", name: "Performance", description: "Response time, compression, caching, render-blocking.", checks: 0 },
  { key: "security", icon: "shield", name: "Security headers", description: "HTTPS, HSTS, CSP, clickjacking and cookie flags.", checks: 0 },
  { key: "ssl", icon: "lock", name: "SSL / TLS", description: "Certificate trust, expiry and protocol strength.", checks: 0 },
  { key: "accessibility", icon: "accessibility", name: "Accessibility", description: "Alt text, labels, headings, zoom and link text.", checks: 0 },
  { key: "content", icon: "link", name: "Links & content", description: "Broken links, thin content and favicons.", checks: 0 },
  { key: "technical", icon: "smartphone", name: "Mobile & technical", description: "Viewport, redirects, status codes, 404 handling.", checks: 0 },
  { key: "dns", icon: "mail", name: "Email & DNS", description: "MX, SPF, DMARC, CAA and IPv6 records.", checks: 0 },
  { key: "browser", icon: "monitor", name: "Browser & device", description: "Responsive layout, browser compatibility and resource errors.", checks: 0 },
  { key: "layout", icon: "layout", name: "Layout & spacing", description: "Padding, margin, gap and alignment consistency across every page.", checks: 0 },
];

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const countWord = (n: number) => WORDS[n] ?? String(n);
const formatCount = (n: number) => new Intl.NumberFormat("en", { notation: n >= 10_000 ? "compact" : "standard" }).format(n);

interface HomeViewProps {
  /** Header actions: auth-aware buttons or the signed-in user's menu. */
  actions: ReactNode;
  /** Live numbers; undefined while loading or when the API is unavailable. */
  stats?: PublicStats;
}

/** Presentational home page, rendered both as the static shell and with live data. */
export function HomeView({ actions, stats }: HomeViewProps) {
  const categories = stats?.categoryList.length ? stats.categoryList : FALLBACK_CATEGORIES;
  const figures = stats
    ? [
        { label: "Automated checks", value: stats.checks },
        { label: "Audit categories", value: stats.categories },
        { label: "Scans completed", value: stats.scansCompleted },
        { label: "Websites audited", value: stats.websitesAudited },
      ]
    : null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex min-h-10 items-center gap-2">{actions}</nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:pt-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-bold" aria-live="polite">
              <span className="size-2 rounded-full bg-brand" />
              {stats ? `${stats.checks} automated website checks` : "Automated website checks"}
            </span>
            <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Audit any website. <span className="relative whitespace-nowrap">Fix what<span className="absolute inset-x-0 bottom-1 -z-10 h-4 bg-brand sm:h-5" /></span> matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted">
              Texan Website Checker scans SEO, performance, security, SSL, accessibility, layout spacing and email deliverability in one pass — then turns the results into a clear, shareable report.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/register" size="lg">
                Start free audit <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">I have an account</LinkButton>
            </div>
          </div>
          {figures && (
            <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
              {figures.map((f) => (
                <div key={f.label} className="bg-surface p-4">
                  <dt className="text-xs font-medium text-muted">{f.label}</dt>
                  <dd className="mt-1 text-2xl font-extrabold tracking-tight">{formatCount(f.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="bg-ink py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold tracking-[0.25em] text-brand uppercase">What we check</p>
          <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight">
            {countWord(categories.length)} audit categories. Pick exactly the checks you need.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div key={c.key} className="rounded-card border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-brand text-ink">
                    <CategoryIcon icon={c.icon} className="size-5" />
                  </span>
                  {c.checks > 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/80">{c.checks} checks</span>}
                </div>
                <p className="mt-4 font-bold">{c.name}</p>
                <p className="mt-1 text-sm text-white/60">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
        <Logo />
        <p>© Texan Website Checker</p>
      </footer>
    </div>
  );
}

/** Sign-in / sign-up buttons for visitors. */
export function GuestActions() {
  return (
    <>
      <LinkButton href="/login" variant="ghost" size="sm">Sign in</LinkButton>
      <LinkButton href="/register" variant="dark" size="sm">Get started</LinkButton>
    </>
  );
}
