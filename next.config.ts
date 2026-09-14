import type { NextConfig } from "next";

/**
 * Studio Mashariki - Next.js configuration
 *
 * Do not use `output: "export"`: Clerk, generateMetadata, and Convex
 * server reads all need a Node server.
 *
 * `standalone` is for Docker / Firebase / self-hosting. On Vercel it must
 * stay off: Next.js 16.3 plus Vercel's adapter skips writing
 * `.next/next-server.js.nft.json`, then `onBuildComplete` crashes with ENOENT
 * (https://github.com/vercel/next.js/issues/96646). Vercel ignores the
 * standalone folder anyway.
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),

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
