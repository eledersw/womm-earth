import type { NextConfig } from "next";

// FastAPI (api/index.py) serves every /api/py/* route.
// Dev: uvicorn on 127.0.0.1:8000 — NOT "localhost": on Windows, Node resolves
// localhost to ::1 and uvicorn won't answer. Prod: Vercel's Python function at /api/.
const isDev = process.env.NODE_ENV === "development";

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
  // Geometry and the starfield change only on deploy: let browsers reuse them for
  // an hour and revalidate in the background (no content hash, so not immutable).
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }];
    return [
      { source: "/geo/:path*", headers: cache },
      { source: "/stars.svg", headers: cache },
      { source: "/stars-bright.svg", headers: cache },
    ];
  },
  // The landing page lives at "/" and the app at "/app". Share links made before the
  // move ("/?v=…&r=…") still open the case.
  async redirects() {
    return ["v", "r"].map((key) => ({ source: "/", has: [{ type: "query" as const, key }], destination: "/app", permanent: false }));
  },
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination: isDev ? "http://127.0.0.1:8000/api/py/:path*" : "/api/",
      },
    ];
  },
};

export default nextConfig;
