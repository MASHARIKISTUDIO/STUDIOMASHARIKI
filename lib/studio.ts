/**
 * Studio facts that appear on service and booking pages.
 *
 * Hours and city are public information from the page designs. Telephone is
 * omitted on purpose: the mockups used a placeholder number, and emitting a
 * fake one in the UI (or in JSON-LD) would be worse than no number.
 */
export const studio = {
  hours: {
    days: "Mon – Sat",
    time: "9:00 AM – 10:00 PM",
    note: "By appointment",
  },
  /** Civil timezone for the booking calendar. Nairobi does not observe DST. */
  timezone: "Africa/Nairobi",
  location: {
    name: "Studio Mashariki",
    city: "Nairobi, Kenya",
  },
} as const;
