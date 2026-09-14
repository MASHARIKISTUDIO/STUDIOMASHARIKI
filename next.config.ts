import type { NextConfig } from "next";

/**
 * Studio Mashariki - Next.js configuration
 *
 * Hosting target: Firebase Hosting.
 *
 * We deliberately use `output: "standalone"` rather than `output: "export"`.
 * A static export cannot run this app because it depends on server-rendered
 * behaviour that must execute per request:
 *   - Clerk authentication on /dashboard
 *   - `generateMetadata` + per-gallery JSON-LD on /galleries/[id]
 *   - Convex server-side reads for freshly created galleries
 *
 * `standalone` emits a self-contained server bundle in `.next/standalone`,
 * which Firebase serves through a Cloud Function / Cloud Run backend while
 * static assets are served from the Firebase CDN. See `firebase.json`.
 */
const nextConfig: NextConfig = {
  output: "standalone",

  // Surface type errors at build time instead of silently shipping.
  // Note: Next.js 16 removed the `eslint` key from next.config; linting is run
  // separately via the ESLint CLI (`pnpm lint`).
  typescript: { ignoreBuildErrors: false },

  images: {
    // Remote media that `next/image` is allowed to optimize.
    remotePatterns: [
      // Seed / placeholder photography
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudflare Stream thumbnails
      { protocol: "https", hostname: "videodelivery.net" },
      { protocol: "https", hostname: "*.cloudflarestream.com" },
      // S3 / S3-compatible buckets and CDN fronts
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
};

export default nextConfig;
