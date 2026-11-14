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
