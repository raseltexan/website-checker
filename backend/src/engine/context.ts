import tls from "node:tls";
import * as cheerio from "cheerio";
import { env } from "../config/env.js";
import { assertPublicHost } from "../utils/url.js";
import type { Settings } from "../modules/settings/settings.validation.js";

export interface PageResponse {
  url: string;
  finalUrl: string;
  status: number;
  headers: Headers;
  setCookies: string[];
  html: string;
  bytes: number;
  ttfbMs: number;
  totalMs: number;
  redirects: { url: string; status: number }[];
}

export interface CrawledPage {
  url: string;
  status: number;
  html: string;
  $: cheerio.CheerioAPI;
}

export interface TextResource {
  url: string;
  status: number;
  contentType: string;
  body: string;
}

/** File extensions that are never HTML pages, skipped while crawling. */
const NON_PAGE_EXT = /\.(?:pdf|zip|rar|gz|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mp3|wav|css|js|json|xml|txt|docx?|xlsx?|pptx?)$/i;

export interface TlsInfo {
  authorized: boolean;
  authorizationError?: string;
  protocol: string | null;
  validFrom?: string;
  validTo?: string;
  issuer?: string;
  subject?: string;
}

/**
 * Per-scan shared state. Expensive network operations (page fetch, TLS handshake, extra
 * resources) are memoised so multiple checks can reuse them.
 */
export class ScanContext {
  readonly target: URL;
  private pagePromise?: Promise<PageResponse>;
  private tlsPromise?: Promise<TlsInfo>;
  private dom?: cheerio.CheerioAPI;
  private readonly resourceCache = new Map<string, Promise<{ status: number; body: string } | null>>();
  private readonly hostCache = new Map<string, Promise<boolean>>();
  private readonly textCache = new Map<string, Promise<TextResource | null>>();
  private crawlPromise?: Promise<CrawledPage[]>;

  constructor(
    url: string,
    readonly settings: Settings["audit"],
    readonly browser: Settings["browser"],
  ) {
    this.target = new URL(url);
  }

  private async isSafeHost(hostname: string) {
    if (!this.hostCache.has(hostname)) {
      this.hostCache.set(hostname, assertPublicHost(hostname).then(() => true, () => false));
    }
    return this.hostCache.get(hostname)!;
  }

  /** fetch() with timeout, UA and SSRF protection. Redirects are NOT followed. */
  async request(url: string, init: RequestInit = {}) {
    const parsed = new URL(url);
    if (!(await this.isSafeHost(parsed.hostname))) throw new Error(`Blocked non-public host ${parsed.hostname}`);
    return fetch(parsed, {
      redirect: "manual",
      ...init,
      headers: { "user-agent": env.SCAN_USER_AGENT, accept: "text/html,application/xhtml+xml,*/*;q=0.8", ...init.headers },
      signal: AbortSignal.timeout(this.settings.requestTimeoutMs),
    });
  }

  /** Follows redirects manually so each hop is recorded and SSRF-checked. */
  async follow(url: string, init: RequestInit = {}) {
    const redirects: { url: string; status: number }[] = [];
    let current = url;
    const started = performance.now();
    for (let hop = 0; hop <= this.settings.maxRedirects; hop++) {
      const res = await this.request(current, init);
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        redirects.push({ url: current, status: res.status });
        await res.body?.cancel();
        current = new URL(location, current).toString();
        continue;
      }
      return { res, finalUrl: current, redirects, ttfbMs: Math.round(performance.now() - started) };
    }
    throw new Error(`Too many redirects (>${this.settings.maxRedirects})`);
  }

  page(): Promise<PageResponse> {
    this.pagePromise ??= (async () => {
      const started = performance.now();
      const { res, finalUrl, redirects, ttfbMs } = await this.follow(this.target.toString());
      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        url: this.target.toString(),
        finalUrl,
        status: res.status,
        headers: res.headers,
        setCookies: res.headers.getSetCookie(),
        html: buffer.toString("utf8"),
        bytes: buffer.byteLength,
        ttfbMs,
        totalMs: Math.round(performance.now() - started),
        redirects,
      };
    })();
    return this.pagePromise;
  }

  async $() {
    if (!this.dom) this.dom = cheerio.load((await this.page()).html);
    return this.dom;
  }

  /** Fetches a same-origin resource (e.g. /robots.txt). Returns null on network failure. */
  resource(path: string) {
    if (!this.resourceCache.has(path)) {
      const promise = (async () => {
        const base = (await this.page()).finalUrl;
        try {
          const { res } = await this.follow(new URL(path, base).toString());
          return { status: res.status, body: res.ok ? (await res.text()).slice(0, 500_000) : "" };
        } catch {
          return null;
        }
      })();
      this.resourceCache.set(path, promise);
    }
    return this.resourceCache.get(path)!;
  }

  /**
   * Fetches any absolute URL (any public host) as text, following redirects.
   * Used for stylesheets and crawled pages. Returns null on network failure.
   */
  fetchText(url: string, maxBytes = 2_000_000) {
    if (!this.textCache.has(url)) {
      const promise = (async (): Promise<TextResource | null> => {
        try {
          const { res, finalUrl } = await this.follow(url);
          const contentType = res.headers.get("content-type") ?? "";
          const body = res.ok ? Buffer.from(await res.arrayBuffer()).subarray(0, maxBytes).toString("utf8") : "";
          if (!res.ok) await res.body?.cancel().catch(() => undefined);
          return { url: finalUrl, status: res.status, contentType, body };
        } catch {
          return null;
        }
      })();
      this.textCache.set(url, promise);
    }
    return this.textCache.get(url)!;
  }

  /**
   * Same-origin crawl: the scanned page plus internal pages discovered from its links
   * and /sitemap.xml, up to `maxPagesToCrawl`. Shared by every multi-page check.
   */
  crawl(): Promise<CrawledPage[]> {
    this.crawlPromise ??= (async () => {
      const home = await this.page();
      const origin = new URL(home.finalUrl).origin;
      const limit = this.settings.maxPagesToCrawl;
      const pages: CrawledPage[] = [{ url: home.finalUrl, status: home.status, html: home.html, $: await this.$() }];
      const seen = new Set([canonicalPath(home.finalUrl)]);

      const normalize = (href: string, base: string) => {
        try {
          const u = new URL(href, base);
          u.hash = "";
          if (u.origin !== origin || NON_PAGE_EXT.test(u.pathname)) return null;
          return u.toString();
        } catch {
          return null;
        }
      };
      const linksOf = ($: cheerio.CheerioAPI, base: string) =>
        $("a[href]")
          .map((_, el) => $(el).attr("href") ?? "")
          .get()
          .filter((h) => h && !/^(#|mailto:|tel:|javascript:|data:)/i.test(h))
          .map((h) => normalize(h, base))
          .filter((u): u is string => Boolean(u));

      const queue = linksOf(pages[0]!.$, home.finalUrl);
      const sitemap = await this.resource("/sitemap.xml");
      if (sitemap?.body) {
        for (const m of sitemap.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
          const u = normalize(m[1]!, home.finalUrl);
          if (u) queue.push(u);
        }
      }

      // Breadth-first, fetching a few pages at a time.
      while (queue.length && pages.length < limit) {
        const batch: string[] = [];
        while (queue.length && batch.length < Math.min(4, limit - pages.length)) {
          const next = queue.shift()!;
          const key = canonicalPath(next);
          if (seen.has(key)) continue;
          seen.add(key);
          batch.push(next);
        }
        const fetched = await Promise.all(batch.map((u) => this.fetchText(u)));
        for (const res of fetched) {
          if (!res || res.status >= 400 || !/html/i.test(res.contentType) || !res.body) continue;
          // A redirect may land on a page that was already crawled.
          if (pages.some((p) => canonicalPath(p.url) === canonicalPath(res.url))) continue;
          const $ = cheerio.load(res.body);
          pages.push({ url: res.url, status: res.status, html: res.body, $ });
          seen.add(canonicalPath(res.url));
          queue.push(...linksOf($, res.url));
          if (pages.length >= limit) break;
        }
      }
      return pages;
    })();
    return this.crawlPromise;
  }

  /** Lightweight status probe used by link checking. */
  async probe(url: string): Promise<number | null> {
    try {
      let { res } = await this.follow(url, { method: "HEAD" });
      if (res.status === 405 || res.status === 501) ({ res } = await this.follow(url));
      await res.body?.cancel();
      return res.status;
    } catch {
      return null;
    }
  }

  async finalHost() {
    return new URL((await this.page()).finalUrl).hostname;
  }

  tlsInfo(): Promise<TlsInfo> {
    this.tlsPromise ??= (async () => {
      const host = await this.finalHost();
      if (!(await this.isSafeHost(host))) throw new Error("Blocked non-public host");
      return new Promise<TlsInfo>((resolve, reject) => {
        const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: this.settings.requestTimeoutMs }, () => {
          const cert = socket.getPeerCertificate();
          resolve({
            authorized: socket.authorized,
            authorizationError: socket.authorizationError ? String(socket.authorizationError) : undefined,
            protocol: socket.getProtocol(),
            validFrom: cert?.valid_from,
            validTo: cert?.valid_to,
            issuer: cert?.issuer ? [cert.issuer.O, cert.issuer.CN].filter(Boolean).join(" / ") : undefined,
            subject: [cert?.subject?.CN].flat()[0],
          });
          socket.end();
        });
        socket.on("timeout", () => {
          socket.destroy();
          reject(new Error("TLS handshake timed out"));
        });
        socket.on("error", reject);
      });
    })();
    return this.tlsPromise;
  }
}

/** Path-level identity for de-duplicating crawled URLs (ignores query, hash, trailing slash). */
const canonicalPath = (url: string) => {
  const u = new URL(url);
  return `${u.origin}${u.pathname.replace(/\/+$/, "") || "/"}`;
};
