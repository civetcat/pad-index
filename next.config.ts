import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vinext does not fully support cacheComponents yet. Keep pages dynamic.
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
