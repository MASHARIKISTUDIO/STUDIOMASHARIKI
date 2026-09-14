import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { parseRole, type Role } from "./model/users";

/**
 * Convex HTTP endpoints.
 *
 * Registered at `https://<deployment>.convex.site/<path>` (note `.site`, not
 * `.cloud`). Configure the Clerk webhook against:
 *
 *   https://<deployment>.convex.site/clerk-webhook
 *
 * subscribed to `user.created`, `user.updated` and `user.deleted`.
 *
 * Required Convex env vars (these run on Convex's servers, so `.env.local` is
 * not enough - use `npx convex env set`):
 *   CLERK_WEBHOOK_SECRET   whsec_...  from the Clerk webhook endpoint page
 *   CLERK_SECRET_KEY       sk_...     to write publicMetadata back to Clerk
 *   CLERK_ADMIN_EMAILS     optional comma-separated bootstrap admin allowlist
 */
const http = httpRouter();

const DEFAULT_ROLE: Role = "event_photographer";

/** Svix tolerates a 5 minute clock skew; replays outside it are rejected. */
const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Length-independent, constant-time string comparison.
 *
 * A plain `===` on a signature leaks how many leading bytes matched through its
 * early return, which is enough to forge a signature byte by byte.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  // Fold the length difference into the result instead of returning early.
  let mismatch = aBytes.length ^ bBytes.length;
  const max = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < max; i += 1) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

/**
 * Verifies a Svix-signed Clerk webhook.
 *
 * Implemented against Web Crypto rather than pulling in the `svix` package: the
 * scheme is a single HMAC and this keeps the function in Convex's default
 * runtime (no `"use node"`), which an httpAction needs to stay fast.
 *
 * Signed payload is `{id}.{timestamp}.{body}`, HMAC-SHA256 keyed by the secret
 * with its `whsec_` prefix stripped and the remainder base64-decoded.
 */
async function verifyClerkWebhook(request: Request): Promise<string | null> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (secret === undefined || secret.trim() === "") {
    throw new Error(
      "Missing CLERK_WEBHOOK_SECRET. Set it with: npx convex env set CLERK_WEBHOOK_SECRET whsec_...",
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (svixId === null || svixTimestamp === null || svixSignature === null) {
    return null;
  }

  // Reject stale deliveries so a captured request cannot be replayed forever.
  const timestampMs = Number(svixTimestamp) * 1000;
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > WEBHOOK_TOLERANCE_MS
  ) {
    return null;
  }

  const body = await request.text();

  const keyBytes = base64ToBytes(secret.replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${svixId}.${svixTimestamp}.${body}`),
  );
  const expected = bytesToBase64(new Uint8Array(mac));

  // The header carries a space-separated list of `version,signature` pairs so
  // secrets can be rotated; any v1 entry matching is enough.
  const matched = svixSignature
    .split(" ")
    .map((part) => part.split(","))
    .some(
      ([version, signature]) =>
        version === "v1" && signature !== undefined &&
        timingSafeEqual(signature, expected),
    );

  return matched ? body : null;
}

/** Bootstrap allowlist so the first admin can exist before any UI does. */
function isBootstrapAdmin(email: string | undefined): boolean {
  if (email === undefined) return false;
  const raw = process.env.CLERK_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)
    .includes(email.toLowerCase());
}

/** Pulls the primary email out of a Clerk user payload. */
function primaryEmail(data: Record<string, unknown>): string | undefined {
  const addresses = data.email_addresses;
  if (!Array.isArray(addresses)) return undefined;

  const primaryId = data.primary_email_address_id;
  const chosen =
    addresses.find(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" &&
        entry !== null &&
        (entry as Record<string, unknown>).id === primaryId,
    ) ??
    (typeof addresses[0] === "object" && addresses[0] !== null
      ? (addresses[0] as Record<string, unknown>)
      : undefined);

  const value = chosen?.email_address;
  return typeof value === "string" ? value : undefined;
}

/**
 * Writes the resolved role back into Clerk `publicMetadata`.
 *
 * Needed because the edge check in `proxy.ts` reads the role from the session
 * token, and a token can only carry what Clerk stores. Self-registered users
 * arrive with empty metadata, so this is what makes their role visible to
 * routing on their very first request.
 */
async function writeClerkRole(clerkId: string, role: Role): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey === undefined || secretKey.trim() === "") {
    // Non-fatal: Convex remains authoritative for data access, so a missing key
    // degrades routing, not security.
    console.error("CLERK_SECRET_KEY is not set; skipping metadata write.");
    return;
  }

  const response = await fetch(
    `https://api.clerk.com/v1/users/${clerkId}/metadata`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_metadata: { role } }),
    },
  );

  if (!response.ok) {
    console.error(
      `Failed to write Clerk role for ${clerkId}: ${response.status} ${await response.text()}`,
    );
  }
}

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await verifyClerkWebhook(request);
    if (body === null) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Everything below this line is untrusted input; narrow before use.
    let event: unknown;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Malformed JSON", { status: 400 });
    }
    if (typeof event !== "object" || event === null) {
      return new Response("Malformed payload", { status: 400 });
    }

    const { type, data } = event as Record<string, unknown>;
    if (typeof type !== "string" || typeof data !== "object" || data === null) {
      return new Response("Malformed payload", { status: 400 });
    }
    const payload = data as Record<string, unknown>;

    const clerkId = payload.id;
    if (typeof clerkId !== "string") {
      return new Response("Missing user id", { status: 400 });
    }

    if (type === "user.created" || type === "user.updated") {
      const metadata =
        typeof payload.public_metadata === "object" &&
        payload.public_metadata !== null
          ? (payload.public_metadata as Record<string, unknown>)
          : {};

      const existingRole = parseRole(metadata.role);
      const email = primaryEmail(payload);

      /**
       * Resolution order, least-surprising first:
       *  1. A role already set in Clerk metadata wins - that is an admin's
       *     deliberate act via the dashboard.
       *  2. Otherwise the bootstrap email allowlist can mint the first admin.
       *  3. Otherwise the self-registration default.
       *
       * Note that a role is never read from anything the *signing-up user*
       * controls, so nobody can self-assign admin at registration.
       */
      const role: Role =
        existingRole ??
        (isBootstrapAdmin(email) ? "admin" : DEFAULT_ROLE);

      await ctx.runMutation(internal.users.syncRoleFromClerk, {
        clerkId,
        role,
      });

      // Backfill Clerk so the session token carries the claim.
      if (existingRole !== role) {
        await writeClerkRole(clerkId, role);
      }

      return new Response(null, { status: 200 });
    }

    if (type === "user.deleted") {
      await ctx.runMutation(internal.users.deleteByClerkId, { clerkId });
      return new Response(null, { status: 200 });
    }

    // Unsubscribed event types are acknowledged so Clerk stops retrying.
    return new Response(null, { status: 200 });
  }),
});

export default http;
