import type { Role } from "@/lib/roles";

/**
 * Declares the custom claim we add to the Clerk session token, so
 * `sessionClaims.metadata.role` is typed instead of `unknown` everywhere.
 *
 * This mirrors a REQUIRED one-time Clerk configuration step. In the Clerk
 * dashboard, under Sessions -> Customize session token, set:
 *
 *   {
 *     "metadata": "{{user.public_metadata}}"
 *   }
 *
 * Without that, the claim is absent at runtime and every edge role check falls
 * back to the default (non-admin) role. The type says nothing about whether the
 * claim is actually configured, which is exactly why `roleFromSessionClaims`
 * treats a missing claim as "not an admin" rather than trusting the type.
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role;
    };
  }
}

export {};
