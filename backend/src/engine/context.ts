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
