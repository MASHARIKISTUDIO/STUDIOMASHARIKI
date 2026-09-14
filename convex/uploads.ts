"use node";

import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Upload destination broker.
 *
 * This file carries `"use node"` because the AWS SDK needs Node built-ins, so
 * it must contain ONLY actions - Convex requires queries/mutations to stay in
 * the default runtime. Gallery writes live in `galleries.ts`.
 *
 * Env vars are read from `process.env` and must be set on the Convex
 * deployment itself (`npx convex env set ...`), not just in `.env.local`:
 * these run on Convex's servers, not in Next.js.
 */

/** 5 GB - comfortably above a long 4K ceremony master. */
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024;
/** 100 MB - generous for a full-resolution RAW/JPEG export. */
const MAX_IMAGE_BYTES = 100 * 1024 * 1024;

const PRESIGN_EXPIRY_SECONDS = 600;

type Provider = "s3" | "cloudflare";

function resolveProvider(): Provider {
  const raw = (process.env.VIDEO_PROCESSING_PROVIDER ?? "s3")
    .trim()
    .toLowerCase();
  if (raw === "cloudflare") return "cloudflare";
  if (raw === "s3") return "s3";
  throw new Error(
    `Invalid VIDEO_PROCESSING_PROVIDER "${raw}". Expected "s3" or "cloudflare".`,
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required environment variable ${name}. Set it with: npx convex env set ${name} <value>`,
    );
  }
  return value.trim();
}

/**
 * Strips directory separators and anything outside a conservative allowlist so
 * a client-supplied filename can never escape its prefix or inject an S3 key.
 */
function sanitiseFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "upload";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+/, "")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "upload";
}

function randomToken(length = 12): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Key prefix for paid, full-resolution masters.
 *
 * SECURITY: the bucket policy MUST deny anonymous `s3:GetObject` under this
 * prefix. Everything else the app writes is world-readable by design (previews
 * are meant to be browsed), so the paywall rests entirely on this prefix being
 * unreadable without a presigned URL. See `.env.example` for the policy.
 */
const PRIVATE_PREFIX = "private/originals";

/** Key prefix for the watermarked, downscaled previews shown to attendees. */
const PUBLIC_PREFIX = "galleries";

function buildObjectKey(
  mediaType: "video" | "image",
  fileName: string,
  variant: "preview" | "original",
) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const folder = mediaType === "video" ? "videos" : "images";
  const prefix = variant === "original" ? PRIVATE_PREFIX : PUBLIC_PREFIX;
  return `${prefix}/${folder}/${year}/${month}/${randomToken()}-${sanitiseFileName(fileName)}`;
}

function s3PublicUrl(bucket: string, region: string, objectKey: string) {
  const configured = process.env.AWS_S3_PUBLIC_URL?.trim();
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  if (configured !== undefined && configured !== "") {
    return `${configured.replace(/\/+$/, "")}/${encodedKey}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function makeS3Client(region: string) {
  const endpoint = process.env.AWS_S3_ENDPOINT?.trim();
  const forcePathStyle =
    (process.env.AWS_S3_FORCE_PATH_STYLE ?? "false").trim().toLowerCase() ===
    "true";

  return new S3Client({
    region,
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
    // Set only for S3-compatible providers (R2, MinIO, Spaces).
    ...(endpoint !== undefined && endpoint !== ""
      ? { endpoint, forcePathStyle: true }
      : { forcePathStyle }),
  });
}

/** Playback + thumbnail URLs for a Cloudflare Stream video UID. */
function cloudflareUrls(uid: string) {
  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN?.trim();
  // `videodelivery.net` is Cloudflare's account-agnostic delivery domain and
  // works without knowing the customer code.
  const host =
    subdomain !== undefined && subdomain !== ""
      ? subdomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")
      : "videodelivery.net";

  return {
    playbackUrl: `https://${host}/${uid}/manifest/video.m3u8`,
    thumbnailUrl: `https://${host}/${uid}/thumbnails/thumbnail.jpg`,
  };
}

const uploadDestinationValidator = v.union(
  v.object({
    provider: v.literal("s3"),
    kind: v.literal("presigned-post"),
    /** POST target for a multipart/form-data browser upload. */
    url: v.string(),
    /** Fields that must be appended to the FormData before the file. */
    fields: v.record(v.string(), v.string()),
    objectKey: v.string(),
    /**
     * Where the asset will be readable once the upload completes.
     *
     * `null` for `variant: "original"`: an HD master has no public URL by
     * design, and returning one would hand the client the very thing the
     * paywall exists to withhold. Access goes through a presigned GET minted
     * only after a confirmed payment.
     */
    publicUrl: v.union(v.string(), v.null()),
    maxBytes: v.number(),
  }),
  v.object({
    provider: v.literal("cloudflare"),
    kind: v.literal("direct-upload"),
    /** One-time Cloudflare upload URL; POST the file here. */
    uploadUrl: v.string(),
    uid: v.string(),
    playbackUrl: v.string(),
    thumbnailUrl: v.string(),
    maxBytes: v.number(),
  }),
);

/**
 * Step 1 of the upload flow: hand the browser somewhere to PUT/POST its file.
 *
 * Provider selection:
 *   - `VIDEO_PROCESSING_PROVIDER=cloudflare` routes **videos** to Cloudflare
 *     Stream (which transcodes to HLS).
 *   - Images always go to S3, because Cloudflare Stream is video-only. So S3
 *     must stay configured even in cloudflare mode.
 */
export const getUploadDestination = action({
  args: {
    fileName: v.string(),
    contentType: v.string(),
    mediaType: v.union(v.literal("video"), v.literal("image")),
    sizeBytes: v.optional(v.number()),
    /**
     * Which half of the pair this upload is.
     *   "preview"  -> public, watermarked, downscaled (default)
     *   "original" -> private HD master, never publicly readable
     * The browser uploads both for a paid image; see `lib/media/derivatives.ts`.
     */
    variant: v.optional(v.union(v.literal("preview"), v.literal("original"))),
  },
  returns: uploadDestinationValidator,
  handler: async (ctx, args) => {
    // Never mint upload credentials for an anonymous caller.
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated.");
    }

    const maxBytes =
      args.mediaType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (args.sizeBytes !== undefined && args.sizeBytes > maxBytes) {
      throw new Error(
        `File is too large. Limit for ${args.mediaType} uploads is ${Math.floor(
          maxBytes / (1024 * 1024),
        )} MB.`,
      );
    }

    // Reject a content type that disagrees with the declared media kind.
    const expectedPrefix = args.mediaType === "video" ? "video/" : "image/";
    if (!args.contentType.toLowerCase().startsWith(expectedPrefix)) {
      throw new Error(
        `Content type "${args.contentType}" does not match media type "${args.mediaType}".`,
      );
    }

    const provider = resolveProvider();
    const variant = args.variant ?? "preview";

    // --- Cloudflare Stream: videos only -----------------------------------
    // Only previews are routed to Stream. A video's HD master still goes to the
    // private S3 prefix, because Stream serves transcoded HLS renditions, not
    // the untouched file an attendee is paying for.
    if (
      provider === "cloudflare" &&
      args.mediaType === "video" &&
      variant === "preview"
    ) {
      const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
      const token = requireEnv("CLOUDFLARE_STREAM_AUTH_TOKEN");
      const rawWatermark =
        process.env.CLOUDFLARE_STREAM_WATERMARK_UID?.trim() ?? "";
      const watermarkUid = rawWatermark === "" ? undefined : rawWatermark;

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Required by the API. 4 hours covers a full ceremony.
            maxDurationSeconds: 4 * 60 * 60,
            expiry: new Date(
              Date.now() + PRESIGN_EXPIRY_SECONDS * 1000,
            ).toISOString(),
            requireSignedURLs: false,
            meta: { name: sanitiseFileName(args.fileName) },
            /**
             * Video cannot be watermarked in the browser the way a still can -
             * there is no reliable client-side transcode. Cloudflare burns the
             * watermark in during transcoding instead, which is why the video
             * half of the preview pipeline lives here and not in
             * `lib/media/derivatives.ts`.
             *
             * Create the profile once (Stream -> Watermark profiles, or
             * POST /stream/watermarks with our logo) and set the returned uid as
             * CLOUDFLARE_STREAM_WATERMARK_UID. Omitted when unset, so an
             * unconfigured deployment still uploads - just without a watermark.
             */
            ...(watermarkUid !== undefined
              ? { watermark: { uid: watermarkUid } }
              : {}),
          }),
        },
      );

      // Treat the response as unknown and narrow before use.
      const payload: unknown = await response.json();
      const result =
        typeof payload === "object" && payload !== null
          ? (payload as { result?: unknown; errors?: unknown }).result
          : undefined;

      const uploadUrl =
        typeof result === "object" && result !== null
          ? (result as { uploadURL?: unknown }).uploadURL
          : undefined;
      const uid =
        typeof result === "object" && result !== null
          ? (result as { uid?: unknown }).uid
          : undefined;

      if (
        !response.ok ||
        typeof uploadUrl !== "string" ||
        typeof uid !== "string"
      ) {
        throw new Error(
          `Cloudflare Stream direct upload failed (HTTP ${response.status}).`,
        );
      }

      const { playbackUrl, thumbnailUrl } = cloudflareUrls(uid);
      return {
        provider: "cloudflare" as const,
        kind: "direct-upload" as const,
        uploadUrl,
        uid,
        playbackUrl,
        thumbnailUrl,
        maxBytes,
      };
    }

    // --- S3 presigned POST -------------------------------------------------
    const region = requireEnv("AWS_REGION");
    const bucket = requireEnv("AWS_S3_BUCKET");
    const objectKey = buildObjectKey(args.mediaType, args.fileName, variant);

    const client = makeS3Client(region);
    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: objectKey,
      Expires: PRESIGN_EXPIRY_SECONDS,
      // Server-enforced upload policy: the browser cannot exceed the size cap
      // or swap in a different content type.
      Conditions: [
        ["content-length-range", 1, maxBytes],
        ["eq", "$Content-Type", args.contentType],
      ],
      Fields: { "Content-Type": args.contentType },
    });

    return {
      provider: "s3" as const,
      kind: "presigned-post" as const,
      url,
      fields,
      objectKey,
      // Withheld for masters - see the validator's note.
      publicUrl:
        variant === "original" ? null : s3PublicUrl(bucket, region, objectKey),
      maxBytes,
    };
  },
});
