import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * Login page.
 *
 * The `[[...rest]]` optional catch-all is REQUIRED, not stylistic. `<SignIn />`
 * defaults to path-based routing and appends segments for its sub-steps
 * (`/sign-in/factor-one`, `/sign-in/reset-password`, the SSO callback, ...).
 * Mounted on a plain `/sign-in` route those segments 404, and in development
 * `@clerk/nextjs` probes for exactly that and throws
 * "The <SignIn/> component is not configured correctly".
 *
 * `proxy.ts` only matches `/dashboard(.*)`, so this route and all of its
 * children stay public - which the same Clerk check also depends on.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${siteConfig.name} account.`,
  alternates: { canonical: absoluteUrl("/sign-in") },
  // An auth page has nothing to rank for, and indexing it invites crawlers into
  // the redirect chain. Mirrors the disallow already in `app/robots.ts`.
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="relative w-full max-w-[25rem]">
      {/* Glow *behind* the Clerk card. Clerk renders its own DOM, so lifting the
          card off the near-black background is done from the outside here
          rather than by fighting its internal class names. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(closest-side,rgba(37,99,235,0.28),transparent)] blur-2xl"
      />
      {/* `relative` so the card paints above the glow. */}
      <div className="relative flex justify-center">
        <SignIn />
      </div>
    </div>
  );
}
