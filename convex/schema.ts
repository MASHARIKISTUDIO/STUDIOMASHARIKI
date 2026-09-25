import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { categoryValidator } from "./categories";

/** Where a piece of media physically lives / how it is played back. */
export const providerValidator = v.union(
  v.literal("s3"),
  v.literal("cloudflare"),
);

/** Media kind. Galleries are hybrid, so both live in the same table. */
export const mediaTypeValidator = v.union(
  v.literal("video"),
  v.literal("image"),
);

/**
 * Application roles.
 *
 * `event_photographer` is the self-service role: anyone may register for it
 * publicly with no admin approval, and it is the default assigned on sign-up.
 * `admin` is never self-assigned - it is granted out of band (Clerk dashboard
 * or the CLERK_ADMIN_EMAILS bootstrap list).
 *
 * Attendees who buy HD media are NOT users: the purchase flow is anonymous and
 * keyed on the phone/email captured at checkout, so it needs no account.
 */
export const roleValidator = v.union(
  v.literal("admin"),
  v.literal("event_photographer"),
);

/** Services that can be booked from the public calendar. */
export const bookingProductValidator = v.union(
  v.literal("beatmaking"),
  v.literal("vocal-recording"),
  v.literal("mixing-mastering"),
  v.literal("beat-production"),
  v.literal("video-production"),
  v.literal("music-videos"),
  v.literal("choir-chorals"),
  v.literal("events"),
  v.literal("weddings"),
  v.literal("burials"),
  v.literal("ruracio"),
  v.literal("anniversaries"),
  v.literal("graduations"),
  v.literal("social-media-reels"),
  v.literal("corporate-events"),
  v.literal("video-editing"),
  v.literal("motion-graphics"),
  v.literal("graphic-design"),
  v.literal("photography"),
  v.literal("portrait-photography"),
  v.literal("event-photography"),
  v.literal("product-photography"),
  v.literal("real-estate-photography"),
  v.literal("lifestyle-photography"),
  v.literal("commercial-photography"),
  v.literal("nature-photography"),
  v.literal("photo-editing"),
  v.literal("script-writing"),
  v.literal("adverts"),
  v.literal("documentaries"),
  v.literal("short-films"),
  v.literal("corporate-videos"),
);

/** Lifecycle of a WhatsApp booking request. */
export const appointmentStatusValidator = v.union(
  /** Slot held after the visitor opened WhatsApp (or copied the message). */
  v.literal("requested"),
  /** Freed by an admin; no longer occupies the calendar. */
  v.literal("cancelled"),
);

/** Lifecycle of an M-Pesa STK Push purchase. */
export const transactionStatusValidator = v.union(
  /** STK Push accepted by Daraja; waiting on the customer's PIN. */
  v.literal("pending"),
  /** Callback confirmed payment. The only status that counts as revenue. */
  v.literal("success"),
  /** Callback reported a non-zero ResultCode. */
  v.literal("failed"),
  /** Customer dismissed the prompt. */
  v.literal("cancelled"),
  /** No callback arrived inside the reconciliation window. */
  v.literal("timeout"),
);

export default defineSchema({
  /**
   * Mirror of the Clerk user, created on first authenticated write.
   *
   * `tokenIdentifier` is Convex's canonical stable identity key
   * (issuer + subject) and is what every ownership check resolves through.
   * `clerkId` is kept for cross-referencing the Clerk dashboard/webhooks.
   */
  users: defineTable({
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),

    /**
     * Authorization source of truth for everything running inside Convex.
     *
     * Clerk's `publicMetadata.role` is the source of truth for the Next.js
     * layer (proxy.ts route matching), and the Clerk webhook mirrors it here.
     * We do NOT read the role off the JWT: Convex's `UserIdentity` only
     * surfaces standard OIDC claims reliably, and a role read from a token the
     * client holds is weaker than one read from our own database.
     *
     * Optional so pre-existing rows keep validating. Read it through
     * `resolveRole()` in `model/users.ts`, which defaults `undefined` to
     * `event_photographer` rather than to `admin`.
     */
    role: v.optional(roleValidator),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkId", ["clerkId"])
    // Powers the "total registered event photographers" analytics tile.
    .index("by_role", ["role"]),

  /**
   * A shareable delivery gallery, addressed by an unguessable `slug`
   * (e.g. /galleries/xep92awt).
   */
  galleries: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),

    /** Primary category. Drives the badge and the JSON-LD @type. */
    category: categoryValidator,
    /**
     * All applied categories, including `category`. Galleries are frequently
     * hybrid ("Arusi" + "Ruracio"), and this array is what the taxonomy
     * filters and keyword metadata read from.
     *
     * Bounded by the 12-item taxonomy, so it is safe as an inline array.
     */
    categories: v.array(categoryValidator),

    /**
     * `true` hides the gallery from public listings, the sitemap and search
     * engines. It remains reachable via its unguessable link so clients can
     * share it with family who have no account. See `getGalleryBySlug`.
     */
    isPrivate: v.boolean(),

    userId: v.id("users"),

    /** Denormalised poster frame so listings never fan out to media_items. */
    coverImageUrl: v.optional(v.string()),

    /** Editorial metadata used by Event JSON-LD. */
    eventDate: v.optional(v.string()),
    location: v.optional(v.string()),

    /** Explicit creation timestamp (mirrors `_creationTime`). */
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"])
    // Powers getAllPublicGalleries; Convex appends _creationTime, so
    // .order("desc") yields newest-public-first without a JS sort.
    .index("by_isPrivate", ["isPrivate"])
    .index("by_category_and_isPrivate", ["category", "isPrivate"]),

  /**
   * One row per uploaded asset. Separate table (not an array on the gallery)
   * so a gallery can grow past the 1MB document limit.
   */
  media_items: defineTable({
    galleryId: v.id("galleries"),
    type: mediaTypeValidator,
    provider: providerValidator,

    /**
     * Playback source.
     *  - provider "s3": the object URL, played by a native <video>/<img>.
     *  - provider "cloudflare": the HLS manifest (.m3u8) for Stream.
     */
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    title: v.string(),

    /** Original-quality asset for the "Download Original" button. */
    downloadUrl: v.optional(v.string()),

    /** Cloudflare Stream video UID; absent for S3 assets. */
    playbackId: v.optional(v.string()),
    /** S3 object key; absent for Cloudflare assets. */
    objectKey: v.optional(v.string()),

    /** Intrinsic dimensions, so the grid can reserve space and avoid CLS. */
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    sizeBytes: v.optional(v.number()),

    /** Manual sort position within the gallery. */
    order: v.number(),

    /**
     * The photographer who uploaded this asset.
     *
     * Until now ownership was derived transitively from the gallery. Moderation
     * needs it stored per item: "the photographer who uploaded it" must be able
     * to hide their own asset, which is not the same person as the gallery
     * owner once a gallery accepts uploads from more than one photographer.
     *
     * Optional for backfill; `canModerateMedia()` falls back to gallery
     * ownership when it is absent.
     */
    uploadedBy: v.optional(v.id("users")),

    // --- Moderation ---------------------------------------------------------
    /**
     * `true` withholds the item from all public/attendee-facing queries.
     * Distinct from `galleries.isPrivate`, which only unlists a whole gallery
     * while leaving it reachable by slug. Hidden media is withheld even from
     * someone holding the slug.
     *
     * Optional in the validator so existing rows keep validating; every public
     * read goes through the visibility index with an explicit `false`, so the
     * backfill migration must write these fields rather than leave them unset.
     */
    isHidden: v.optional(v.boolean()),
    /** `true` marks the item as not-safe-for-work. Also withheld from public. */
    isNsfw: v.optional(v.boolean()),
    /** Who last flipped a moderation flag, for an audit trail. */
    moderatedBy: v.optional(v.id("users")),
    moderatedAt: v.optional(v.number()),

    // --- Monetisation -------------------------------------------------------
    /**
     * Price in whole Kenyan shillings for the HD original. M-Pesa STK Push
     * amounts are integers, so this is never fractional. Absent means "not for
     * sale" and the Buy HD affordance is not rendered.
     */
    priceKes: v.optional(v.number()),
    /**
     * Storage key of the untouched full-resolution master, used only to mint
     * expiring download URLs after a confirmed payment. Kept separate from
     * `objectKey`/`downloadUrl` so the HD original is never addressable from a
     * public document read.
     */
    hdObjectKey: v.optional(v.string()),
  })
    .index("by_galleryId", ["galleryId"])
    .index("by_galleryId_and_order", ["galleryId", "order"])
    /**
     * Public/attendee reads. Equality on galleryId + both moderation flags,
     * then `order` as the trailing sort column, so filtering happens inside the
     * index range instead of scanning a gallery and dropping rows in JS.
     */
    .index("by_galleryId_and_visibility_and_order", [
      "galleryId",
      "isHidden",
      "isNsfw",
      "order",
    ])
    /** A photographer's own uploads across every gallery, for their dashboard. */
    .index("by_uploadedBy", ["uploadedBy"]),

  /**
   * One row per M-Pesa STK Push attempt, created before the push is sent so a
   * callback can always be correlated back to an intent.
   *
   * Attendees are anonymous: `phoneNumber` and `email` are captured at checkout
   * and are the only contact details we hold. There is no `userId`.
   */
  transactions: defineTable({
    mediaId: v.id("media_items"),
    /** Denormalised so revenue can be attributed without loading the media. */
    galleryId: v.id("galleries"),

    /** Normalised to Daraja's 2547XXXXXXXX MSISDN format before storing. */
    phoneNumber: v.string(),
    /** Where the HD download link is delivered on success. */
    email: v.string(),

    /** Whole shillings actually pushed, snapshotted so later price edits
     * cannot rewrite historical revenue. */
    amountKes: v.number(),

    status: transactionStatusValidator,

    /** Daraja correlation ids from the STK Push response. */
    merchantRequestId: v.optional(v.string()),
    /** The id the callback echoes back; our lookup key on the webhook path. */
    checkoutRequestId: v.optional(v.string()),
    /** M-Pesa receipt (e.g. QK12ABC34D), present only on success. */
    mpesaReceiptNumber: v.optional(v.string()),

    /** Raw callback outcome, retained for support and reconciliation. */
    resultCode: v.optional(v.number()),
    resultDesc: v.optional(v.string()),

    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    /** Set once the delivery email has actually been handed to the provider,
     * so a replayed callback cannot send a second email. */
    deliveredAt: v.optional(v.number()),
  })
    // Webhook lookup: the callback carries CheckoutRequestID and nothing else
    // we control.
    .index("by_checkoutRequestId", ["checkoutRequestId"])
    // Revenue analytics: equality on status, range/order on createdAt, so
    // "successful payments in the last 30 days" stays inside the index.
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_mediaId", ["mediaId"])
    .index("by_galleryId", ["galleryId"])
    // Lets a buyer re-request their own links, and supports support lookups.
    .index("by_email", ["email"]),

  /**
   * Time-limited download grants minted after a confirmed payment.
   *
   * A separate table rather than a field on the transaction because the grant
   * has its own lifecycle: it expires, it can be revoked, and it counts uses.
   * `token` is the unguessable bearer secret in the emailed URL.
   */
  download_grants: defineTable({
    token: v.string(),
    transactionId: v.id("transactions"),
    mediaId: v.id("media_items"),

    /** Absolute expiry (ms epoch). 24h after minting, per the delivery spec. */
    expiresAt: v.number(),
    /** Abuse ceiling: a forwarded link cannot be redeemed indefinitely. */
    maxDownloads: v.number(),
    downloadCount: v.number(),
    /** Admin kill switch for a leaked link. */
    isRevoked: v.boolean(),

    createdAt: v.number(),
    lastDownloadedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_transactionId", ["transactionId"])
    // Lets a cron sweep expired grants without scanning the table.
    .index("by_expiresAt", ["expiresAt"]),

  /**
   * Admin-editable frontend content. A single row addressed by `key`
   * ("hero", "about", ...) so the admin can edit copy without a deploy.
   */
  site_settings: defineTable({
    key: v.string(),
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    heroCtaLabel: v.optional(v.string()),
    heroCtaHref: v.optional(v.string()),
    /**
     * Public MP4 or WebM played behind the homepage hero. Optional so rows
     * written before this field existed stay valid.
     */
    homeHeroVideoUrl: v.optional(v.string()),
    /** Public MP4 or WebM played behind the gallery index hero. */
    galleryHeroVideoUrl: v.optional(v.string()),
    /** Default price applied to newly uploaded media, in whole shillings. */
    defaultPriceKes: v.optional(v.number()),
    /**
     * WhatsApp destination for booking messages, digits only with country
     * code and no leading plus (e.g. 2547XXXXXXXX). Used by the public
     * booking modal. Optional so older rows keep validating.
     */
    whatsappNumber: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  /** Admin-authored announcements rendered on the public site. */
  announcements: defineTable({
    title: v.string(),
    body: v.string(),
    /** Unpublished drafts are withheld from public reads. */
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_isPublished_and_publishedAt", ["isPublished", "publishedAt"]),

  /**
   * Denormalised counters. Convex has no count operator and the guidelines
   * forbid `.collect().length`, so totals the dashboard shows on every load
   * (photographer count, lifetime revenue) are maintained incrementally in the
   * same mutation as the write that changes them.
   */
  stats: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  /**
   * Admin-blocked studio hours. One row per occupied hour; the public calendar
   * treats these as unavailable alongside active appointments.
   *
   * `date` is a Nairobi calendar day (`YYYY-MM-DD`). `startMinutes` is minutes
   * from midnight that day (e.g. 14:00 → 840). Duration is always one hour.
   */
  busy_slots: defineTable({
    date: v.string(),
    startMinutes: v.number(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_date_and_startMinutes", ["date", "startMinutes"]),

  /**
   * A visitor's requested session, created when they send (or copy) the
   * WhatsApp appointment message. Occupies the slot until an admin cancels it.
   */
  appointments: defineTable({
    productId: bookingProductValidator,
    date: v.string(),
    startMinutes: v.number(),
    customerName: v.optional(v.string()),
    status: appointmentStatusValidator,
    createdAt: v.number(),
  })
    .index("by_date_and_startMinutes", ["date", "startMinutes"])
    .index("by_status_and_date", ["status", "date"]),
});
