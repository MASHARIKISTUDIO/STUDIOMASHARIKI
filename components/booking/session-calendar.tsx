"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatMonthTitle,
  isStudioOpenDate,
  latestBookableDate,
  listSessionSlots,
  monthGrid,
  shiftMonth,
  WEEKDAY_LABELS,
} from "@/lib/booking";
import { studio } from "@/lib/studio";
import { cn } from "@/lib/utils";

export type SlotKind = "available" | "busy" | "booked" | "past" | "selected";

export function slotOccupancy(args: {
  date: string;
  startMinutes: number;
  today: string;
  nowMinutes: number;
  occupied: ReadonlySet<string>;
  kindForOccupied?: SlotKind;
}): SlotKind | "closed" {
  if (!isStudioOpenDate(args.date)) {
    return "closed";
  }
  if (args.date < args.today) {
    return "past";
  }
  if (args.date === args.today && args.startMinutes <= args.nowMinutes) {
    return "past";
  }
  if (args.date > latestBookableDate(args.today)) {
    return "past";
  }
  if (args.occupied.has(`${args.date}:${args.startMinutes}`)) {
    return args.kindForOccupied ?? "busy";
  }
  return "available";
}

export function SessionCalendar({
  year,
  monthIndex,
  onMonthChange,
  selectedDate,
  onSelectDate,
  selectedMinutes,
  onSelectSlot,
  occupied,
  occupiedKind,
  today,
  nowMinutes,
  slotHint,
  timesPending = false,
}: {
  year: number;
  monthIndex: number;
  onMonthChange: (year: number, monthIndex: number) => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedMinutes: number | null;
  onSelectSlot: (startMinutes: number) => void;
  occupied: ReadonlySet<string>;
  occupiedKind?: (date: string, startMinutes: number) => SlotKind;
  today: string;
  nowMinutes: number;
  slotHint?: string;
  timesPending?: boolean;
}) {
  const latest = latestBookableDate(today);
  const cells = monthGrid(year, monthIndex);
  const prev = shiftMonth(year, monthIndex, -1);
  const next = shiftMonth(year, monthIndex, 1);
  const prevDisabled = monthEnd(prev.year, prev.monthIndex) < today;
  const nextDisabled = toDateString(next.year, next.monthIndex, 1) > latest;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(prev.year, prev.monthIndex)}
            disabled={prevDisabled}
            className="flex size-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
            {formatMonthTitle(year, monthIndex)}
          </p>
          <button
            type="button"
            onClick={() => onMonthChange(next.year, next.monthIndex)}
            disabled={nextDisabled}
            className="flex size-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (date === null) {
              return <span key={`empty-${index}`} className="aspect-square" />;
            }
            const closed = !isStudioOpenDate(date);
            const outOfRange = date < today || date > latest;
            const selected = date === selectedDate;
            const isToday = date === today;
            return (
              <button
                key={date}
                type="button"
                disabled={closed || outOfRange}
                onClick={() => onSelectDate(date)}
                aria-pressed={selected}
                aria-label={date}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400",
                  closed || outOfRange
                    ? "cursor-not-allowed text-gray-600"
                    : "text-gray-200 hover:bg-white/10",
                  selected && "bg-cyan-400 text-gray-950 hover:bg-cyan-300",
                  isToday && !selected && "ring-1 ring-cyan-400/70",
                )}
              >
                {Number(date.slice(-2))}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {studio.hours.days} · {studio.hours.time} · East Africa Time
        </p>
      </div>

      <div>
        <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
          {timesPending
            ? "Loading times"
            : selectedDate
              ? "Pick a time"
              : "Select a date"}
        </p>
        {slotHint ? (
          <p className="mt-1 text-xs text-gray-400">{slotHint}</p>
        ) : null}
        <ul className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-2">
          {listSessionSlots().map((slot) => {
            const kind: SlotKind | "closed" =
              selectedDate === null || timesPending
                ? "past"
                : occupiedKind !== undefined &&
                    occupied.has(`${selectedDate}:${slot.startMinutes}`)
                  ? occupiedKind(selectedDate, slot.startMinutes)
                  : slotOccupancy({
                      date: selectedDate,
                      startMinutes: slot.startMinutes,
                      today,
                      nowMinutes,
                      occupied,
                    });
            const selected =
              selectedDate !== null && selectedMinutes === slot.startMinutes;
            const disabled = kind !== "available" && !selected;
            return (
              <li key={slot.startMinutes}>
                <button
                  type="button"
                  disabled={selectedDate === null || (disabled && !selected)}
                  onClick={() => onSelectSlot(slot.startMinutes)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full flex-col rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed",
                    selected
                      ? "border-cyan-400 bg-cyan-400 text-gray-950"
                      : kind === "available"
                        ? "border-white/10 bg-gray-900/70 text-white hover:border-cyan-400/50"
                        : kind === "booked"
                          ? "border-amber-400/30 bg-amber-400/10 text-amber-200/80"
                          : kind === "busy"
                            ? "border-red-400/20 bg-red-400/10 text-red-200/70"
                            : "border-white/5 bg-gray-950 text-gray-600",
                  )}
                >
                  <span className="font-semibold">{slot.label}</span>
                  <span className={cn("text-[0.65rem] uppercase tracking-[0.12em]", selected ? "text-gray-800" : "text-current opacity-80")}>
                    {kind === "available" || selected
                      ? slot.endLabel
                      : kind === "booked"
                        ? "Booked"
                        : kind === "busy"
                          ? "Busy"
                          : selectedDate === null || timesPending
                            ? slot.endLabel
                            : kind === "past"
                              ? "Passed"
                              : "Unavailable"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function monthEnd(year: number, monthIndex: number): string {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return toDateString(year, monthIndex, lastDay);
}

function toDateString(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
