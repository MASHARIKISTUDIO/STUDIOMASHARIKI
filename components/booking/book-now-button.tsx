"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import { cyanPillClassName } from "@/components/service-pages/shared";
import { calendarProduct, type BookingProductId, type CalendarProduct } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { useBookingModal } from "./booking-provider";

export function BookNowButton({
  product,
  productId,
  className,
  children,
}: {
  product?: CalendarProduct;
  productId?: BookingProductId;
  className?: string;
  children?: React.ReactNode;
}) {
  const { openWith } = useBookingModal();
  const resolved = product ?? (productId !== undefined ? calendarProduct(productId) : undefined);

  return (
    <button
      type="button"
      onClick={() => openWith(resolved)}
      className={cn(cyanPillClassName, "px-4 py-2 text-xs", className)}
    >
      {children ?? (
        <>
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Book now
        </>
      )}
    </button>
  );
}

export function BookSessionCta({
  product,
  productId,
  children,
  className,
}: {
  product?: CalendarProduct;
  productId?: BookingProductId;
  children: React.ReactNode;
  className?: string;
}) {
  const { openWith } = useBookingModal();
  const resolved = product ?? (productId !== undefined ? calendarProduct(productId) : undefined);

  return (
    <button
      type="button"
      onClick={() => openWith(resolved)}
      className={cn(cyanPillClassName, className)}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}

export function BookableCard({
  productId,
  className,
  children,
}: {
  productId: BookingProductId;
  className?: string;
  children: React.ReactNode;
}) {
  const { openWith } = useBookingModal();

  return (
    <button
      type="button"
      onClick={() => openWith(calendarProduct(productId))}
      className={cn("w-full text-left", className)}
    >
      {children}
    </button>
  );
}

export function BookProductChip({
  productId,
  children,
  className,
}: {
  productId: BookingProductId;
  children: React.ReactNode;
  className?: string;
}) {
  const { openWith } = useBookingModal();

  return (
    <button
      type="button"
      onClick={() => openWith(calendarProduct(productId))}
      className={cn(
        "rounded transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        className,
      )}
    >
      {children}
    </button>
  );
}
