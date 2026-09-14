"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import { cyanPillClassName } from "@/components/service-pages/shared";
import { cn } from "@/lib/utils";
import type { CalendarProduct } from "@/lib/booking";
import { useBookingModal } from "./booking-provider";

export function BookNowButton({
  product,
  className,
}: {
  product: CalendarProduct;
  className?: string;
}) {
  const { openWith } = useBookingModal();

  return (
    <button
      type="button"
      onClick={() => openWith(product)}
      className={cn(cyanPillClassName, "px-4 py-2 text-xs", className)}
    >
      <CalendarDays className="size-3.5" aria-hidden="true" />
      Book now
    </button>
  );
}

export function BookSessionCta({ children }: { children: React.ReactNode }) {
  const { openWith } = useBookingModal();

  return (
    <button type="button" onClick={() => openWith()} className={cyanPillClassName}>
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}
