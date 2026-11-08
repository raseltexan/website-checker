import { Accessibility, ArrowRight, Gauge, Link2, Lock, Mail, Monitor, Search, Shield, Smartphone } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LinkButton } from "@/components/ui/Button";

const CATEGORIES = [
  { icon: Search, name: "SEO", text: "Titles, meta, canonical, sitemaps, structured data." },
  { icon: Gauge, name: "Performance", text: "Response time, compression, caching, render-blocking." },
  { icon: Shield, name: "Security headers", text: "HTTPS, HSTS, CSP, clickjacking and cookie flags." },
  { icon: Lock, name: "SSL / TLS", text: "Certificate trust, expiry and protocol strength." },
  { icon: Accessibility, name: "Accessibility", text: "Alt text, labels, headings, zoom and link text." },
  { icon: Link2, name: "Links & content", text: "Broken links, thin content and favicons." },
  { icon: Smartphone, name: "Mobile & technical", text: "Viewport, redirects, status codes, 404 handling." },
  { icon: Mail, name: "Email & DNS", text: "MX, SPF, DMARC, CAA and IPv6 records." },
  { icon: Monitor, name: "Browser & device", text: "Real-browser testing (integration ready)." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <LinkButton href="/login" variant="ghost" size="sm">Sign in</LinkButton>
          <LinkButton href="/register" variant="dark" size="sm">Get started</LinkButton>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:pt-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-bold">
              <span className="size-2 rounded-full bg-brand" /> 50+ automated website checks
            </span>
            <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Audit any website. <span className="relative whitespace-nowrap">Fix what<span className="absolute inset-x-0 bottom-1 -z-10 h-4 bg-brand sm:h-5" /></span> matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted">
              Texan Website Checker scans SEO, performance, security, SSL, accessibility and email deliverability in one pass — then turns the results into a clear, shareable report.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/register" size="lg">
                Start free audit <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">I have an account</LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold tracking-[0.25em] text-brand uppercase">What we check</p>
          <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight">Nine audit categories. Pick exactly the checks you need.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(({ icon: Icon, name, text }) => (
              <div key={name} className="rounded-card border border-white/10 bg-white/[0.03] p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-brand text-ink">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 font-bold">{name}</p>
                <p className="mt-1 text-sm text-white/60">{text}</p>
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
