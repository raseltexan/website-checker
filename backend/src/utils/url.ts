import { lookup } from "node:dns/promises";
import net from "node:net";
import { ApiError } from "./ApiError.js";

/** Normalises user input into an absolute http(s) URL. */
export const normalizeUrl = (input: string) => {
  const trimmed = input.trim();
  const raw = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw ApiError.badRequest("Invalid URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw ApiError.badRequest("Only http and https URLs are supported");
  url.hash = "";
  return url;
};

const isPrivateIp = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const [a = 0, b = 0] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
};

/** SSRF guard: rejects hosts that resolve to private, loopback or link-local addresses. */
export const assertPublicHost = async (hostname: string) => {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw ApiError.badRequest("Scanning local or internal hosts is not allowed");
  }
  let addresses: { address: string }[];
  try {
    addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  } catch {
    throw ApiError.badRequest(`Could not resolve host "${host}"`);
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw ApiError.badRequest("Scanning private network addresses is not allowed");
  }
};
