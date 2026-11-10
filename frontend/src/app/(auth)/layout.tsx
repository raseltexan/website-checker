import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LoadingState } from "@/components/ui/States";
import { AppProviders } from "@/redux/AppProviders";

const HIGHLIGHTS = [
  "SEO, performance & security audits",
  "SSL, DNS and email authentication checks",
  "Accessibility & broken link detection",
  "Shareable, print-ready PDF reports",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-0 h-2 w-full bg-brand" aria-hidden />
        <Logo className="brightness-0 invert" inverted />
        <div className="relative my-auto max-w-md">
          <p className="text-xs font-bold tracking-[0.25em] text-brand uppercase">Website intelligence</p>
          <h2 className="mt-4 text-4xl leading-tight font-extrabold tracking-tight">
            Know exactly what&apos;s holding your website <span className="text-brand">back.</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="size-5 text-brand" /> {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white">© Texan. All rights reserved.</p>
      </aside>
      <main className="flex flex-col bg-surface px-6 py-10 sm:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <AppProviders fallback={<LoadingState />}>{children}</AppProviders>
        </div>
      </main>
    </div>
  );
}
