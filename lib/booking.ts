import {
  addDays,
  formatLongDate,
  formatMinutes,
  MAX_ADVANCE_DAYS,
  parseDateParts,
  SLOT_DURATION_MINUTES,
} from "@/convex/model/booking";

export {
  addDays,
  BOOKING_PRODUCTS,
  BOOKING_PRODUCT_IDS,
  BOOKING_TIMEZONE,
  formatLongDate,
  formatMinutes,
  isStudioOpenDate,
  listSessionSlots,
  MAX_ADVANCE_DAYS,
  nairobiDateString,
  nairobiMinutesFromMidnight,
  occupiedKey,
  SLOT_DURATION_MINUTES,
  slotStartUtcMs,
  type BookingProductId,
} from "@/convex/model/booking";

export const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export type CalendarProduct = {
  id: import("@/convex/model/booking").BookingProductId;
  title: string;
  price: string;
};

/** First and last Nairobi calendar dates of a month (inclusive). */
export function monthDateRange(
  year: number,
  monthIndex: number,
): { fromDate: string; toDate: string } {
  const fromDate = toDateString(year, monthIndex, 1);
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return { fromDate, toDate: toDateString(year, monthIndex, lastDay) };
}

export function monthFromDate(date: string): { year: number; monthIndex: number } {
  const parts = parseDateParts(date);
  if (parts === null) {
    throw new Error("Invalid date.");
  }
  return { year: parts.year, monthIndex: parts.month - 1 };
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const next = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() };
}

export function formatMonthTitle(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

/**
 * 6×7 grid of Nairobi calendar dates for a month, Monday-first.
 * Leading/trailing cells from adjacent months are `null`.
 */
export function monthGrid(
  year: number,
  monthIndex: number,
): Array<string | null> {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < mondayOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(toDateString(year, monthIndex, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  while (cells.length < 42) {
    cells.push(null);
  }
  return cells;
}

export function slotRangeLabel(startMinutes: number): string {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(startMinutes + SLOT_DURATION_MINUTES)}`;
}

export function appointmentSummary(args: {
  title: string;
  date: string;
  startMinutes: number;
}): string {
  return `${args.title} · ${formatLongDate(args.date)} · ${slotRangeLabel(args.startMinutes)}`;
}

export function latestBookableDate(today: string): string {
  return addDays(today, MAX_ADVANCE_DAYS);
}

function toDateString(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  const dayPart = String(day).padStart(2, "0");
  return `${year}-${month}-${dayPart}`;
}
