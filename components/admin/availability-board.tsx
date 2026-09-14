"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { convex } from "@/app/providers";
import { SessionCalendar, type SlotKind } from "@/components/booking/session-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  appointmentSummary,
  formatLongDate,
  monthDateRange,
  monthFromDate,
  slotRangeLabel,
} from "@/lib/booking";

export function AvailabilityBoard({
  today,
  nowMinutes,
}: {
  today: string;
  nowMinutes: number;
}) {
  if (!convex) {
    return (
      <p className="text-sm text-gray-400">
        Convex is not configured, so the calendar cannot load.
      </p>
    );
  }
  return (
    <AvailabilityBoardConnected today={today} nowMinutes={nowMinutes} />
  );
}

function AvailabilityBoardConnected({
  today,
  nowMinutes,
}: {
  today: string;
  nowMinutes: number;
}) {
  const [{ year, monthIndex }, setMonth] = useState(() => monthFromDate(today));
  const range = monthDateRange(year, monthIndex);
  const schedule = useQuery(api.booking.listAdminSchedule, range);
  const toggleBusySlot = useMutation(api.booking.toggleBusySlot);
  const setDayBusy = useMutation(api.booking.setDayBusy);
  const cancelAppointment = useMutation(api.booking.cancelAppointment);
  const setWhatsappNumber = useMutation(api.booking.setWhatsappNumber);

  const [date, setDate] = useState<string | null>(null);
  const [whatsappDraft, setWhatsappDraft] = useState<string | null>(null);
  const [savingNumber, setSavingNumber] = useState(false);
  const whatsapp = whatsappDraft ?? schedule?.whatsappNumber ?? "";

  const occupied = useMemo(() => {
    const keys = new Set<string>();
    for (const slot of schedule?.slots ?? []) {
      keys.add(`${slot.date}:${slot.startMinutes}`);
    }
    return keys;
  }, [schedule]);

  const kindByKey = useMemo(() => {
    const map = new Map<string, SlotKind>();
    for (const slot of schedule?.slots ?? []) {
      map.set(
        `${slot.date}:${slot.startMinutes}`,
        slot.source === "booked" ? "booked" : "busy",
      );
    }
    return map;
  }, [schedule]);

  const dayAppointments = (schedule?.appointments ?? []).filter(
    (row) => date === null || row.date === date,
  );

  async function onSelectSlot(startMinutes: number) {
    if (date === null) {
      return;
    }
    const kind = kindByKey.get(`${date}:${startMinutes}`);
    if (kind === "booked") {
      toast.message("That hour is booked. Cancel it in the list below to free it.");
      return;
    }
    try {
      const result = await toggleBusySlot({ date, startMinutes });
      toast.success(result.busy ? "Marked busy." : "Marked free.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update that hour.");
    }
  }

  async function blockDay(busy: boolean) {
    if (date === null) {
      return;
    }
    try {
      const result = await setDayBusy({ date, busy });
      toast.success(
        busy
          ? `Blocked ${result.changed} free hour${result.changed === 1 ? "" : "s"}.`
          : `Cleared ${result.changed} busy hour${result.changed === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update that day.");
    }
  }

  async function saveWhatsapp(event: React.FormEvent) {
    event.preventDefault();
    setSavingNumber(true);
    try {
      await setWhatsappNumber({ whatsappNumber: whatsapp });
      toast.success("WhatsApp number saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the number.");
    } finally {
      setSavingNumber(false);
    }
  }

  async function onCancel(appointmentId: Id<"appointments">) {
    try {
      await cancelAppointment({ appointmentId });
      toast.success("Booking cancelled. That hour is free again.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel.");
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={(event) => void saveWhatsapp(event)}
        className="rounded-xl border border-white/10 bg-gray-900/50 p-4"
      >
        <Label htmlFor="whatsapp-number">WhatsApp number for bookings</Label>
        <p className="mt-1 text-xs text-gray-400">
          Country code, digits only — for Kenya that looks like 2547XXXXXXXX.
          Visitors send the appointment to this number.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            id="whatsapp-number"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="2547XXXXXXXX"
            value={whatsapp}
            onChange={(event) => setWhatsappDraft(event.target.value)}
          />
          <Button type="submit" disabled={savingNumber}>
            Save number
          </Button>
        </div>
      </form>

      <section className="rounded-xl border border-white/10 bg-gray-900/50 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-400">
              Studio hours
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Tap an hour to mark it busy or free. Booked hours stay booked until
              you cancel them.
            </p>
          </div>
          {date ? (
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => void blockDay(true)}>
                Block day
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void blockDay(false)}>
                Clear busy
              </Button>
            </div>
          ) : null}
        </div>

        <SessionCalendar
          year={year}
          monthIndex={monthIndex}
          onMonthChange={(nextYear, nextMonth) => {
            setMonth({ year: nextYear, monthIndex: nextMonth });
            setDate(null);
          }}
          selectedDate={date}
          onSelectDate={setDate}
          selectedMinutes={null}
          onSelectSlot={(startMinutes) => void onSelectSlot(startMinutes)}
          occupied={occupied}
          occupiedKind={(slotDate, startMinutes) =>
            kindByKey.get(`${slotDate}:${startMinutes}`) ?? "busy"
          }
          today={today}
          nowMinutes={nowMinutes}
          timesPending={schedule === undefined}
          slotHint={
            date
              ? `Editing ${formatLongDate(date)}`
              : "Select a date, then tap hours to toggle busy."
          }
        />
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-400">
          Requested appointments
        </h2>
        {schedule === undefined ? (
          <p className="mt-3 text-sm text-gray-400">Loading…</p>
        ) : dayAppointments.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">
            No WhatsApp bookings in this {date ? "day" : "month"} yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
            {dayAppointments.map((row) => (
              <li
                key={row._id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-white">
                    {appointmentSummary({
                      title: row.productTitle,
                      date: row.date,
                      startMinutes: row.startMinutes,
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {row.customerName ?? "No name given"} · {slotRangeLabel(row.startMinutes)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => void onCancel(row._id)}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
