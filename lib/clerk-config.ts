/**
 * Clerk is required for dashboard auth, but the public site must still render
 * if Vercel is missing keys. Clerk's middleware throws on every request when
 * `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` are empty, which is a site-wide
 * 500.
 *
 * Placeholder values from `.env.example` (`pk_test_xxx…`) are treated as unset.
 *
 * The publishable key is a server env var (`CLERK_PUBLISHABLE_KEY`), not
 * `NEXT_PUBLIC_*`. Pass it into `<ClerkProvider publishableKey>` from a Server
 * Component; do not read this module from Client Components or the key will be
 * missing in the browser.
 */

function isRealClerkKey(value: string | undefined, prefix: "pk_" | "sk_"): boolean {
  const key = value?.trim() ?? "";
  if (!key.startsWith(prefix)) {
    return false;
  }
  if (/x{6,}/i.test(key)) {
    return false;
  }
  return key.length >= 40;
}

export const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY?.trim() ?? "";

export const isClerkConfigured = isRealClerkKey(clerkPublishableKey, "pk_");

export function isClerkSecretConfigured(): boolean {
  return isRealClerkKey(process.env.CLERK_SECRET_KEY, "sk_");
}
