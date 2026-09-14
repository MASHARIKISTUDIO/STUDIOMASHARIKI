import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * Registration page, the counterpart to `/sign-in`.
 *
 * Same optional catch-all requirement as the sign-in route: `<SignUp />` walks
 * through `/sign-up/verify-email-address` and friends, and those segments have
 * to resolve to this page.
 *
 * Self-registration grants `DEFAULT_ROLE` (`event_photographer`) - see
 * `lib/roles.ts`. Nothing on this page decides that; the Clerk webhook in
 * `convex/http.ts` does, which is why there is no role picker here.
 */
export const metadata: Metadata = {
  title: "Create an account",
  description: `Create a ${siteConfig.name} account.`,
  alternates: { canonical: absoluteUrl("/sign-up") },
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="relative w-full max-w-[25rem]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(closest-side,rgba(37,99,235,0.28),transparent)] blur-2xl"
      />
      <div className="relative flex justify-center">
        <SignUp />
      </div>
    </div>
  );
}
