"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CalendarProduct } from "@/lib/booking";

type BookingContextValue = {
  open: boolean;
  product: CalendarProduct | null;
  openWith: (product?: CalendarProduct) => void;
  close: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<CalendarProduct | null>(null);

  const openWith = useCallback((next?: CalendarProduct) => {
    setProduct(next ?? null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ open, product, openWith, close }),
    [open, product, openWith, close],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBookingModal(): BookingContextValue {
  const value = useContext(BookingContext);
  if (value === null) {
    throw new Error("useBookingModal must be used within BookingProvider.");
  }
  return value;
}
