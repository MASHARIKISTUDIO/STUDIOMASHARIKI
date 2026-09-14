"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { convex } from "@/app/providers";
import { cyanPillClassName } from "@/components/service-pages/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import {
  appointmentSummary,
  type CalendarProduct,
  formatLongDate,
  monthDateRange,
  monthFromDate,
  slotRangeLabel,
} from "@/lib/booking";
import { cn } from "@/lib/utils";
import { useBookingModal } from "./booking-provider";
import { SessionCalendar } from "./session-calendar";

const envWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function BookingModal({
  products,
  today,
  nowMinutes,
}: {
  products: CalendarProduct[];
  today: string;
  nowMinutes: number;
}) {
  const { open, close, product } = useBookingModal();

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="max-h-[90svh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a session</DialogTitle>
          <DialogDescription>
            Pick a date and time, then send the appointment on WhatsApp.
          </DialogDescription>
        </DialogHeader>
        {convex ? (
          <ConnectedBookingForm
            key={product?.id ?? "any"}
            products={products}
            selectedProduct={product}
            today={today}
            nowMinutes={nowMinutes}
          />
        ) : (
          <BookingForm
            key={product?.id ?? "any"}
            products={products}
            selectedProduct={product}
            occupied={new Set()}
            whatsappConfigured={envWhatsapp.length >= 10}
            today={today}
            nowMinutes={nowMinutes}
            onRequest={null}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConnectedBookingForm({
  products,
  selectedProduct,
  today,
  nowMinutes,
}: {
  products: CalendarProduct[];
  selectedProduct: CalendarProduct | null;
  today: string;
  nowMinutes: number;
}) {
  const [{ year, monthIndex }, setMonth] = useState(() => monthFromDate(today));
  const range = monthDateRange(year, monthIndex);
  const occupiedRows = useQuery(api.booking.listOccupiedSlots, range);
  const contact = useQuery(api.booking.bookingContact);
  const requestAppointment = useMutation(api.booking.requestAppointment);

  const occupied = useMemo(() => {
    const keys = new Set<string>();
    for (const row of occupiedRows ?? []) {
      keys.add(`${row.date}:${row.startMinutes}`);
    }
    return keys;
  }, [occupiedRows]);

  return (
    <BookingForm
      products={products}
      selectedProduct={selectedProduct}
      occupied={occupied}
      whatsappConfigured={
        contact?.whatsappConfigured === true || envWhatsapp.length >= 10
      }
      year={year}
      monthIndex={monthIndex}
      onMonthChange={(nextYear, nextMonth) =>
        setMonth({ year: nextYear, monthIndex: nextMonth })
      }
      today={today}
      nowMinutes={nowMinutes}
      timesPending={occupiedRows === undefined}
      onRequest={async (args) => {
        const result = await requestAppointment(args);
        const fallbackUrl =
          result.whatsappUrl ??
          (envWhatsapp.replace(/\D/g, "").length >= 10
            ? `https://wa.me/${envWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(result.message)}`
            : null);
        return { ...result, whatsappUrl: fallbackUrl };
      }}
    />
  );
}

function BookingForm({
  products,
  selectedProduct,
  occupied,
  whatsappConfigured,
  year,
  monthIndex,
  onMonthChange,
  today,
  nowMinutes,
  timesPending = false,
  onRequest,
}: {
  products: CalendarProduct[];
  selectedProduct: CalendarProduct | null;
  occupied: ReadonlySet<string>;
  whatsappConfigured: boolean;
  year?: number;
  monthIndex?: number;
  onMonthChange?: (year: number, monthIndex: number) => void;
  today: string;
  nowMinutes: number;
  timesPending?: boolean;
  onRequest:
    | ((args: {
        productId: CalendarProduct["id"];
        date: string;
        startMinutes: number;
        customerName?: string;
      }) => Promise<{ message: string; whatsappUrl: string | null }>)
    | null;
}) {
  const initialMonth = monthFromDate(today);
  const [month, setMonth] = useState(initialMonth);
  const [productId, setProductId] = useState<CalendarProduct["id"] | null>(
    selectedProduct?.id ?? null,
  );
  const [date, setDate] = useState<string | null>(null);
  const [startMinutes, setStartMinutes] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const visibleYear = year ?? month.year;
  const visibleMonth = monthIndex ?? month.monthIndex;
  const product =
    products.find((item) => item.id === productId) ?? selectedProduct;

  async function send() {
    if (product === null || date === null || startMinutes === null) {
      return;
    }
    const customerName = name.trim() === "" ? undefined : name.trim();
    setSending(true);
    try {
      let message: string;
      let url: string | null;
      if (onRequest) {
        const result = await onRequest({
          productId: product.id,
          date,
          startMinutes,
          customerName,
        });
        message = result.message;
        url = result.whatsappUrl;
      } else {
        message = [
          "Hi Studio Mashariki,",
          "",
          "I'd like to book a session:",
          "",
          `Service: ${product.title} (${product.price})`,
          `Date: ${formatLongDate(date)}`,
          `Time: ${slotRangeLabel(startMinutes)} (EAT)`,
          ...(customerName ? [`Name: ${customerName}`] : []),
          "",
          "Please confirm. Thanks!",
        ].join("\n");
        const digits = envWhatsapp.replace(/\D/g, "");
        url =
          digits.length >= 10
            ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
            : null;
      }

      if (url !== null) {
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Opening WhatsApp with your appointment.");
      } else {
        try {
          await navigator.clipboard.writeText(message);
          toast.success("Appointment copied. WhatsApp is not configured yet.");
        } catch {
          toast.success(
            "Appointment saved. Add a WhatsApp number in Session hours to send it automatically.",
          );
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not book that time.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <fieldset>
        <legend className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
          Service
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {products.map((item) => {
            const active = item.id === productId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setProductId(item.id);
                  setStartMinutes(null);
                }}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400",
                  active
                    ? "border-cyan-400 bg-cyan-400/15 text-white"
                    : "border-white/10 bg-gray-900/60 text-gray-300 hover:border-cyan-400/40",
                )}
              >
                <span className="block text-sm font-semibold uppercase tracking-[0.08em]">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-cyan-400">
                  {item.price}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <SessionCalendar
        year={visibleYear}
        monthIndex={visibleMonth}
        onMonthChange={(nextYear, nextMonth) => {
          setMonth({ year: nextYear, monthIndex: nextMonth });
          onMonthChange?.(nextYear, nextMonth);
          setDate(null);
          setStartMinutes(null);
        }}
        selectedDate={date}
        onSelectDate={(next) => {
          setDate(next);
          setStartMinutes(null);
        }}
        selectedMinutes={startMinutes}
        onSelectSlot={setStartMinutes}
        occupied={occupied}
        today={today}
        nowMinutes={nowMinutes}
        timesPending={timesPending}
        slotHint="Grey hours are busy or already taken."
      />

      <div className="grid gap-2">
        <Label htmlFor="booking-name">Your name (optional)</Label>
        <Input
          id="booking-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="So we know who is coming in"
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-300">
          {product && date && startMinutes
            ? appointmentSummary({
                title: product.title,
                date,
                startMinutes,
              })
            : "Select a service, date and time."}
        </p>
        <button
          type="button"
          disabled={
            product === null || date === null || startMinutes === null || sending
          }
          onClick={() => void send()}
          className={cn(cyanPillClassName, "justify-center")}
        >
          {whatsappConfigured ? "Send via WhatsApp" : "Copy appointment"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
