import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16.4 defaults for new apps: prerender by default, opt in to
  // request-time work explicitly. See docs/decisions/001-stack-and-rendering.md.
  cacheComponents: true,
  partialPrefetching: true,
  // Tailwind CSS 4 through its Turbopack loader (the create-next-app setup).
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
