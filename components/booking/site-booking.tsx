"use client";

import { useState, type ReactNode } from "react";
import {
  allCalendarProducts,
  nairobiDateString,
  nairobiMinutesFromMidnight,
} from "@/lib/booking";
import { BookingModal } from "./booking-modal";
import { BookingProvider } from "./booking-provider";

/**
 * Site-wide booking calendar. Every Book now control opens this one modal
 * so homepage cards, category chips and service pages share the same hours.
 */
export function SiteBooking({ children }: { children: ReactNode }) {
  const [{ today, nowMinutes }] = useState(() => {
    const now = Date.now();
    return {
      today: nairobiDateString(now),
      nowMinutes: nairobiMinutesFromMidnight(now),
    };
  });

  return (
    <BookingProvider>
      {children}
      <BookingModal
        products={allCalendarProducts()}
        today={today}
        nowMinutes={nowMinutes}
      />
    </BookingProvider>
  );
}
