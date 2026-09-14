/**
 * Convex <-> Clerk auth integration.
 *
 * Convex validates the JWT minted by the Clerk "convex" JWT template. The
 * issuer domain must match that template's Issuer exactly.
 *
 * Set it on the Convex deployment (NOT just in .env.local):
 *   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
 *
 * `applicationID: "convex"` corresponds to the template's audience (`aud`)
 * claim, which the Convex Clerk template sets to "convex".
 */
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
