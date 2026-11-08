import type { NextConfig } from "next";

/** Backend origin. API calls go through the `/api` rewrite so auth cookies stay first-party. */
const configuredApiUrl = process.env.API_URL;
const productionApiUrl = "https://backend-coral-six-85.vercel.app";
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const configuredHost = configuredApiUrl ? new URL(configuredApiUrl).hostname : undefined;
const API_URL =
  process.env.NODE_ENV === "production"
    ? configuredApiUrl && !localHosts.has(configuredHost ?? "")
      ? configuredApiUrl
      : productionApiUrl
    : configuredApiUrl ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
