/**
 * Studio session calendar helpers.
 *
 * Plain module (Convex's `convex/model` convention) — nothing here is a
 * registered function. Imported by Convex booking functions and by the Next.js
 * calendar UI so slot math cannot drift between the two.
 *
 * All civil dates are Africa/Nairobi. Nairobi does not observe DST, so the
 * UTC offset is a fixed +03:00.
 */

import type { QueryCtx } from "../_generated/server";

export const BOOKING_TIMEZONE = "Africa/Nairobi";
export const NAIROBI_UTC_OFFSET_HOURS = 3;

/** First bookable hour (09:00). */
export const OPEN_HOUR = 9;
/** Studio closes at 22:00, so the last session starts at 21:00. */
export const CLOSE_HOUR = 22;
export const SLOT_DURATION_MINUTES = 60;

/** How far ahead a visitor may book, in Nairobi calendar days. */
export const MAX_ADVANCE_DAYS = 60;
/** Hard cap on the occupancy query window so the index scan stays bounded. */
export const MAX_RANGE_DAYS = 62;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const BOOKING_SETTINGS_KEY = "booking";

/**
 * Default WhatsApp destination when Convex has no number saved yet.
 * Kenya 0748903548 → 254748903548.
 */
export const DEFAULT_WHATSAPP_NUMBER = "254748903548";

export const BOOKING_PRODUCTS = {
  beatmaking: { title: "Beat Making", price: "4,000/=" },
  "vocal-recording": { title: "Vocal Recording", price: "1,000/=" },
  "mixing-mastering": { title: "Mixing & Mastering", price: "1,500/=" },
  "beat-production": { title: "Beat Production", price: "Quote" },
  "video-production": { title: "Video Production", price: "Quote" },
  "music-videos": { title: "Music Videos", price: "Quote" },
  "choir-chorals": { title: "Choir Chorals", price: "Quote" },
  events: { title: "Events", price: "Quote" },
  weddings: { title: "Weddings", price: "Quote" },
  burials: { title: "Burials", price: "Quote" },
  ruracio: { title: "Ruracio", price: "Quote" },
  anniversaries: { title: "Anniversaries", price: "Quote" },
  graduations: { title: "Graduations", price: "Quote" },
  "social-media-reels": { title: "Social Media Reels", price: "Quote" },
  "corporate-events": { title: "Corporate Events", price: "Quote" },
  "video-editing": { title: "Video Editing & Colour Grading", price: "Quote" },
  "motion-graphics": { title: "Motion Graphic Designs", price: "Quote" },
  "graphic-design": { title: "Graphic Design", price: "Quote" },
  photography: { title: "Photography", price: "Quote" },
  "portrait-photography": { title: "Portrait Photography", price: "Quote" },
  "event-photography": { title: "Event Photography", price: "Quote" },
  "product-photography": { title: "Product Photography", price: "Quote" },
  "real-estate-photography": { title: "Real Estate Photography", price: "Quote" },
  "lifestyle-photography": { title: "Lifestyle Photography", price: "Quote" },
  "commercial-photography": { title: "Commercial Photography", price: "Quote" },
  "nature-photography": { title: "Nature & Landscape Photography", price: "Quote" },
  "photo-editing": { title: "Photo Editing & Retouching", price: "Quote" },
  "script-writing": { title: "Script Writing", price: "Quote" },
  adverts: { title: "Adverts", price: "Quote" },
  documentaries: { title: "Documentaries", price: "Quote" },
  "short-films": { title: "Short Films", price: "Quote" },
  "corporate-videos": { title: "Corporate Videos", price: "Quote" },
} as const;

export type BookingProductId = keyof typeof BOOKING_PRODUCTS;

export const BOOKING_PRODUCT_IDS = Object.keys(
  BOOKING_PRODUCTS,
) as BookingProductId[];

export type SessionSlot = {
  startMinutes: number;
  endMinutes: number;
  label: string;
  endLabel: string;
};

/** Hourly slots from 09:00 through 21:00 inclusive. */
export function listSessionSlots(): SessionSlot[] {
  const slots: SessionSlot[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour += 1) {
    const startMinutes = hour * 60;
    slots.push({
      startMinutes,
      endMinutes: startMinutes + SLOT_DURATION_MINUTES,
      label: formatMinutes(startMinutes),
      endLabel: formatMinutes(startMinutes + SLOT_DURATION_MINUTES),
    });
  }
  return slots;
}

export function formatMinutes(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function isDateString(value: string): boolean {
  if (!DATE_RE.test(value)) {
    return false;
  }
  const parts = parseDateParts(value);
  if (parts === null) {
    return false;
  }
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const check = new Date(utc);
  return (
    check.getUTCFullYear() === parts.year &&
    check.getUTCMonth() === parts.month - 1 &&
    check.getUTCDate() === parts.day
  );
}

export function parseDateParts(
  date: string,
): { year: number; month: number; day: number } | null {
  const match = DATE_RE.exec(date);
  if (match === null) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * Nairobi calendar date for an instant, `YYYY-MM-DD`.
 *
 * `en-CA` is used because it emits ISO dates; `timeZone` is what makes the
 * civil date Nairobi's rather than the host's.
 */
export function nairobiDateString(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** Minutes from Nairobi midnight for an instant. */
export function nairobiMinutesFromMidnight(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );
  return hour * 60 + minute;
}

export function addDays(date: string, days: number): string {
  const parts = parseDateParts(date);
  if (parts === null) {
    throw new Error("Invalid date.");
  }
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + days);
  const next = new Date(utc);
  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, "0");
  const day = String(next.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetween(fromDate: string, toDate: string): number {
  const from = parseDateParts(fromDate);
  const to = parseDateParts(toDate);
  if (from === null || to === null) {
    throw new Error("Invalid date.");
  }
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/**
 * Day of week for a Nairobi calendar date. 0 = Sunday … 6 = Saturday.
 *
 * The date is interpreted as noon UTC so it is unambiguously that civil day
 * in Nairobi (15:00 EAT).
 */
export function weekdayFromDate(date: string): number {
  const parts = parseDateParts(date);
  if (parts === null) {
    throw new Error("Invalid date.");
  }
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)).getUTCDay();
}

/** Studio is closed on Sunday. */
export function isStudioOpenDate(date: string): boolean {
  return weekdayFromDate(date) !== 0;
}

export function isBookableStartMinutes(startMinutes: number): boolean {
  return (
    startMinutes >= OPEN_HOUR * 60 &&
    startMinutes < CLOSE_HOUR * 60 &&
    startMinutes % SLOT_DURATION_MINUTES === 0
  );
}

/** Instant the session starts, as epoch ms. Nairobi is UTC+3 with no DST. */
export function slotStartUtcMs(date: string, startMinutes: number): number {
  const parts = parseDateParts(date);
  if (parts === null) {
    throw new Error("Invalid date.");
  }
  const hours = Math.floor(startMinutes / 60);
  const minutes = startMinutes % 60;
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hours - NAIROBI_UTC_OFFSET_HOURS,
    minutes,
    0,
    0,
  );
}

export function formatLongDate(date: string): string {
  const parts = parseDateParts(date);
  if (parts === null) {
    return date;
  }
  return new Intl.DateTimeFormat("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

export function occupiedKey(date: string, startMinutes: number): string {
  return `${date}:${startMinutes}`;
}

export function composeAppointmentMessage(args: {
  productId: BookingProductId;
  date: string;
  startMinutes: number;
  customerName?: string;
}): string {
  const product = BOOKING_PRODUCTS[args.productId];
  const start = formatMinutes(args.startMinutes);
  const end = formatMinutes(args.startMinutes + SLOT_DURATION_MINUTES);
  const lines = [
    "Hi Studio Mashariki,",
    "",
    "I'd like to book:",
    "",
    `Service: ${product.title} (${product.price})`,
    `Date: ${formatLongDate(args.date)}`,
    `Time: ${start} – ${end} (EAT)`,
  ];
  if (args.customerName !== undefined && args.customerName.length > 0) {
    lines.push(`Name: ${args.customerName}`);
  }
  lines.push("", "Please confirm. Thanks!");
  return lines.join("\n");
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Kenya-aware WhatsApp MSISDN: 0748… / 748… becomes 254748….
 * Other numbers are returned as digits only.
 */
export function toWhatsappDigits(value: string): string {
  const digits = digitsOnly(value);
  if (digits.startsWith("254")) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

export function resolveWhatsappNumber(stored?: string | null): string {
  const fromSettings =
    stored !== undefined && stored !== null && stored.length > 0
      ? toWhatsappDigits(stored)
      : "";
  if (isWhatsappNumber(fromSettings)) {
    return fromSettings;
  }
  return DEFAULT_WHATSAPP_NUMBER;
}

/** International WhatsApp destination: 10–15 digits, no leading plus. */
export function isWhatsappNumber(value: string): boolean {
  const digits = toWhatsappDigits(value);
  return digits.length >= 10 && digits.length <= 15;
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${toWhatsappDigits(number)}?text=${encodeURIComponent(text)}`;
}

export function assertDateRange(fromDate: string, toDate: string): void {
  if (!isDateString(fromDate) || !isDateString(toDate)) {
    throw new Error("Invalid date range.");
  }
  const span = daysBetween(fromDate, toDate);
  if (span < 0 || span > MAX_RANGE_DAYS) {
    throw new Error("Date range is too large.");
  }
}

export async function loadBusySlots(
  ctx: QueryCtx,
  fromDate: string,
  toDate: string,
) {
  return await ctx.db
    .query("busy_slots")
    .withIndex("by_date_and_startMinutes", (q) =>
      q.gte("date", fromDate).lte("date", toDate),
    )
    .take(1000);
}

export async function loadRequestedAppointments(
  ctx: QueryCtx,
  fromDate: string,
  toDate: string,
) {
  return await ctx.db
    .query("appointments")
    .withIndex("by_status_and_date", (q) =>
      q.eq("status", "requested").gte("date", fromDate).lte("date", toDate),
    )
    .take(1000);
}

export async function loadBookingSettings(ctx: QueryCtx) {
  return await ctx.db
    .query("site_settings")
    .withIndex("by_key", (q) => q.eq("key", BOOKING_SETTINGS_KEY))
    .unique();
}
