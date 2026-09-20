import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  addDays,
  assertDateRange,
  BOOKING_PRODUCTS,
  BOOKING_SETTINGS_KEY,
  composeAppointmentMessage,
  daysBetween,
  isBookableStartMinutes,
  isDateString,
  isStudioOpenDate,
  isWhatsappNumber,
  listSessionSlots,
  loadBookingSettings,
  loadBusySlots,
  loadRequestedAppointments,
  MAX_ADVANCE_DAYS,
  nairobiDateString,
  resolveWhatsappNumber,
  slotStartUtcMs,
  toWhatsappDigits,
  whatsappUrl,
} from "./model/booking";
import { requireAdmin, requireAdminRead } from "./model/users";
import { appointmentStatusValidator, bookingProductValidator } from "./schema";

const occupiedSlotValidator = v.object({
  date: v.string(),
  startMinutes: v.number(),
});

const adminSlotValidator = v.object({
  date: v.string(),
  startMinutes: v.number(),
  source: v.union(v.literal("busy"), v.literal("booked")),
});

const appointmentValidator = v.object({
  _id: v.id("appointments"),
  productId: bookingProductValidator,
  productTitle: v.string(),
  date: v.string(),
  startMinutes: v.number(),
  customerName: v.optional(v.string()),
  status: appointmentStatusValidator,
  createdAt: v.number(),
});

function sanitiseName(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, 80);
}

function assertBookableSlot(args: {
  date: string;
  startMinutes: number;
  nowMs: number;
  allowTodayPast: boolean;
}): void {
  if (!isDateString(args.date)) {
    throw new Error("Invalid date.");
  }
  if (!isStudioOpenDate(args.date)) {
    throw new Error("The studio is closed on Sundays.");
  }
  if (!isBookableStartMinutes(args.startMinutes)) {
    throw new Error("That time is outside studio hours.");
  }

  const today = nairobiDateString(args.nowMs);
  if (args.date < today) {
    throw new Error("That date has already passed.");
  }
  const latest = addDays(today, MAX_ADVANCE_DAYS);
  if (args.date > latest) {
    throw new Error("That date is too far ahead.");
  }
  if (
    !args.allowTodayPast &&
    slotStartUtcMs(args.date, args.startMinutes) <= args.nowMs
  ) {
    throw new Error("That time has already passed.");
  }
}

async function findBusySlot(
  ctx: QueryCtx | MutationCtx,
  date: string,
  startMinutes: number,
) {
  return await ctx.db
    .query("busy_slots")
    .withIndex("by_date_and_startMinutes", (q) =>
      q.eq("date", date).eq("startMinutes", startMinutes),
    )
    .unique();
}

async function findActiveAppointment(
  ctx: QueryCtx | MutationCtx,
  date: string,
  startMinutes: number,
) {
  const rows = await ctx.db
    .query("appointments")
    .withIndex("by_date_and_startMinutes", (q) =>
      q.eq("date", date).eq("startMinutes", startMinutes),
    )
    .take(16);
  return rows.find((row) => row.status === "requested") ?? null;
}

/**
 * Occupied hours for the public calendar. Returns only date + start so a
 * visitor cannot tell busy-by-admin from already-requested.
 */
export const listOccupiedSlots = query({
  args: { fromDate: v.string(), toDate: v.string() },
  returns: v.array(occupiedSlotValidator),
  handler: async (ctx, args) => {
    assertDateRange(args.fromDate, args.toDate);

    const [busy, booked] = await Promise.all([
      loadBusySlots(ctx, args.fromDate, args.toDate),
      loadRequestedAppointments(ctx, args.fromDate, args.toDate),
    ]);

    const seen = new Set<string>();
    const slots: Array<{ date: string; startMinutes: number }> = [];
    for (const row of [...busy, ...booked]) {
      const key = `${row.date}:${row.startMinutes}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      slots.push({ date: row.date, startMinutes: row.startMinutes });
    }
    return slots;
  },
});

/** Whether WhatsApp sending is configured. Does not leak the number. */
export const bookingContact = query({
  args: {},
  returns: v.object({ whatsappConfigured: v.boolean() }),
  handler: async (ctx) => {
    const settings = await loadBookingSettings(ctx);
    const number = resolveWhatsappNumber(settings?.whatsappNumber);
    return {
      whatsappConfigured: isWhatsappNumber(number),
    };
  },
});

/**
 * Holds the slot and returns the WhatsApp deep link with the appointment
 * already written into the message.
 */
export const requestAppointment = mutation({
  args: {
    productId: bookingProductValidator,
    date: v.string(),
    startMinutes: v.number(),
    customerName: v.optional(v.string()),
  },
  returns: v.object({
    appointmentId: v.id("appointments"),
    message: v.string(),
    whatsappUrl: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const nowMs = Date.now();
    assertBookableSlot({
      date: args.date,
      startMinutes: args.startMinutes,
      nowMs,
      allowTodayPast: false,
    });

    const busy = await findBusySlot(ctx, args.date, args.startMinutes);
    if (busy !== null) {
      throw new Error("That time is marked busy.");
    }
    const existing = await findActiveAppointment(
      ctx,
      args.date,
      args.startMinutes,
    );
    if (existing !== null) {
      throw new Error("That time is already booked.");
    }

    const customerName = sanitiseName(args.customerName);
    const appointmentId = await ctx.db.insert("appointments", {
      productId: args.productId,
      date: args.date,
      startMinutes: args.startMinutes,
      ...(customerName !== undefined ? { customerName } : {}),
      status: "requested",
      createdAt: nowMs,
    });

    const message = composeAppointmentMessage({
      productId: args.productId,
      date: args.date,
      startMinutes: args.startMinutes,
      customerName,
    });

    const settings = await loadBookingSettings(ctx);
    const number = resolveWhatsappNumber(settings?.whatsappNumber);
    return {
      appointmentId,
      message,
      whatsappUrl: isWhatsappNumber(number) ? whatsappUrl(number, message) : null,
    };
  },
});

/** Admin calendar: busy hours and live bookings for a visible month. */
export const listAdminSchedule = query({
  args: { fromDate: v.string(), toDate: v.string() },
  returns: v.object({
    slots: v.array(adminSlotValidator),
    appointments: v.array(appointmentValidator),
    whatsappNumber: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    await requireAdminRead(ctx);
    assertDateRange(args.fromDate, args.toDate);

    const [busy, booked, settings] = await Promise.all([
      loadBusySlots(ctx, args.fromDate, args.toDate),
      loadRequestedAppointments(ctx, args.fromDate, args.toDate),
      loadBookingSettings(ctx),
    ]);

    const bookedKeys = new Set(
      booked.map((row) => `${row.date}:${row.startMinutes}`),
    );
    const slots: Array<{
      date: string;
      startMinutes: number;
      source: "busy" | "booked";
    }> = booked.map((row) => ({
      date: row.date,
      startMinutes: row.startMinutes,
      source: "booked",
    }));
    for (const row of busy) {
      if (bookedKeys.has(`${row.date}:${row.startMinutes}`)) {
        continue;
      }
      slots.push({
        date: row.date,
        startMinutes: row.startMinutes,
        source: "busy",
      });
    }

    return {
      slots,
      appointments: booked.map((row) => ({
        _id: row._id,
        productId: row.productId,
        productTitle:
          BOOKING_PRODUCTS[row.productId]?.title ?? row.productId,
        date: row.date,
        startMinutes: row.startMinutes,
        customerName: row.customerName,
        status: row.status,
        createdAt: row.createdAt,
      })),
      whatsappNumber: resolveWhatsappNumber(settings?.whatsappNumber),
    };
  },
});

/** Flip a single hour between busy and free. Booked hours stay booked. */
export const toggleBusySlot = mutation({
  args: { date: v.string(), startMinutes: v.number() },
  returns: v.object({ busy: v.boolean() }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    assertBookableSlot({
      date: args.date,
      startMinutes: args.startMinutes,
      nowMs: Date.now(),
      allowTodayPast: true,
    });

    const booked = await findActiveAppointment(
      ctx,
      args.date,
      args.startMinutes,
    );
    if (booked !== null) {
      throw new Error("Cancel the booking before changing this hour.");
    }

    const existing = await findBusySlot(ctx, args.date, args.startMinutes);
    if (existing !== null) {
      await ctx.db.delete("busy_slots", existing._id);
      return { busy: false };
    }

    await ctx.db.insert("busy_slots", {
      date: args.date,
      startMinutes: args.startMinutes,
      createdAt: Date.now(),
      createdBy: admin._id,
    });
    return { busy: true };
  },
});

/** Mark every hour on a Nairobi calendar day busy, or clear admin blocks. */
export const setDayBusy = mutation({
  args: { date: v.string(), busy: v.boolean() },
  returns: v.object({ changed: v.number() }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!isDateString(args.date) || !isStudioOpenDate(args.date)) {
      throw new Error("The studio is closed on that day.");
    }
    const today = nairobiDateString(Date.now());
    if (args.date < today) {
      throw new Error("That date has already passed.");
    }
    if (daysBetween(today, args.date) > MAX_ADVANCE_DAYS) {
      throw new Error("That date is too far ahead.");
    }

    let changed = 0;
    for (const slot of listSessionSlots()) {
      const booked = await findActiveAppointment(
        ctx,
        args.date,
        slot.startMinutes,
      );
      const existing = await findBusySlot(ctx, args.date, slot.startMinutes);
      if (args.busy) {
        if (booked !== null || existing !== null) {
          continue;
        }
        await ctx.db.insert("busy_slots", {
          date: args.date,
          startMinutes: slot.startMinutes,
          createdAt: Date.now(),
          createdBy: admin._id,
        });
        changed += 1;
      } else if (existing !== null) {
        await ctx.db.delete("busy_slots", existing._id);
        changed += 1;
      }
    }
    return { changed };
  },
});

export const cancelAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const appointment = await ctx.db.get("appointments", args.appointmentId);
    if (appointment === null) {
      throw new Error("Appointment not found.");
    }
    if (appointment.status === "cancelled") {
      return null;
    }
    await ctx.db.patch("appointments", appointment._id, {
      status: "cancelled",
    });
    return null;
  },
});

export const setWhatsappNumber = mutation({
  args: { whatsappNumber: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const digits = toWhatsappDigits(args.whatsappNumber);
    if (digits.length > 0 && !isWhatsappNumber(digits)) {
      throw new Error("Enter a WhatsApp number with country code, digits only.");
    }

    const existing = await loadBookingSettings(ctx);
    const now = Date.now();
    if (existing === null) {
      await ctx.db.insert("site_settings", {
        key: BOOKING_SETTINGS_KEY,
        ...(digits.length > 0 ? { whatsappNumber: digits } : {}),
        updatedAt: now,
        updatedBy: admin._id,
      });
      return null;
    }

    if (digits.length > 0) {
      await ctx.db.patch("site_settings", existing._id, {
        whatsappNumber: digits,
        updatedAt: now,
        updatedBy: admin._id,
      });
      return null;
    }

    await ctx.db.replace("site_settings", existing._id, {
      key: existing.key,
      ...(existing.heroTitle !== undefined ? { heroTitle: existing.heroTitle } : {}),
      ...(existing.heroSubtitle !== undefined
        ? { heroSubtitle: existing.heroSubtitle }
        : {}),
      ...(existing.heroImageUrl !== undefined
        ? { heroImageUrl: existing.heroImageUrl }
        : {}),
      ...(existing.heroCtaLabel !== undefined
        ? { heroCtaLabel: existing.heroCtaLabel }
        : {}),
      ...(existing.heroCtaHref !== undefined
        ? { heroCtaHref: existing.heroCtaHref }
        : {}),
      ...(existing.defaultPriceKes !== undefined
        ? { defaultPriceKes: existing.defaultPriceKes }
        : {}),
      updatedAt: now,
      updatedBy: admin._id,
    });
    return null;
  },
});
