import {
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { SocialLinks } from "@/components/social-links";
import { studio } from "@/lib/studio";
import { cn } from "@/lib/utils";

/** Irregular cyan underline under the brush titles. */
export function PaintStroke({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 18"
      fill="none"
      aria-hidden="true"
      className={cn("h-3 w-full max-w-md text-cyan-400", className)}
    >
      <path
        d="M3 11c38-7 72 6 118-1 46-7 78 8 124 0 40-7 86 6 172 1"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="h-px min-w-6 flex-1 bg-cyan-400/80"
      />
      <h2 className="shrink-0 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-cyan-400 sm:text-xs">
        {children}
      </h2>
      <span aria-hidden="true" className="h-px w-8 bg-cyan-400/80 sm:w-16" />
    </div>
  );
}

export const cyanPillClassName =
  "inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-gray-950 shadow-[0_0_28px_-6px_rgba(34,211,238,0.85)] transition-colors hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-50";

export function CyanCta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(cyanPillClassName, className)}>
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

/**
 * Booking / quote strip.
 *
 * There is no public telephone yet, so this is hours, city and the social
 * profiles — the channels that actually exist. Every "Book" / "Quote" CTA
 * on a service page lands here.
 */
export function EnquireStrip() {
  return (
    <section
      id="enquire"
      aria-labelledby="enquire-heading"
      className="border-t border-cyan-400/20 bg-gray-950"
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3 lg:py-10">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Booking hours
            </p>
            <p className="mt-1 text-sm text-white">
              {studio.hours.days} &nbsp;|&nbsp; {studio.hours.time}
            </p>
            <p className="text-xs text-gray-400">({studio.hours.note})</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-4">
          <MapPin className="mt-0.5 size-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Location
            </p>
            <p className="mt-1 text-sm text-white">{studio.location.name}</p>
            <p className="text-xs text-gray-400">{studio.location.city}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-4">
          <MessageCircle className="mt-0.5 size-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <div className="min-w-0">
            <h2
              id="enquire-heading"
              className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-400"
            >
              Contact us
            </h2>
            <p className="mt-1 text-sm text-white">Message us to book</p>
            <SocialLinks className="-ml-1 mt-1 flex items-center gap-0.5" />
          </div>
        </div>
      </div>
    </section>
  );
}
