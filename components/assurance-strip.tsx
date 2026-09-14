import { Mic, SlidersHorizontal, Star, Users } from "lucide-react";

/**
 * The four-up reassurance row between the services grid and the gallery.
 *
 * Icons intentionally repeat the mic and mixer from the services grid - that
 * repetition is in the design, and swapping in different icons to avoid it would
 * weaken the association rather than strengthen it.
 */
const ASSURANCES = [
  {
    icon: Mic,
    title: "Professional equipment",
    body: "Industry standard gear for crystal clear sound.",
  },
  {
    icon: SlidersHorizontal,
    title: "Expert engineers",
    body: "Skilled & experienced sound professionals.",
  },
  {
    icon: Star,
    title: "Creative environment",
    body: "A space that inspires greatness.",
  },
  {
    icon: Users,
    title: "Artist support",
    body: "From recording to release, we're with you.",
  },
] as const;

export function AssuranceStrip() {
  return (
    <section
      aria-labelledby="assurances-heading"
      className="border-b border-white/10 py-8"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="assurances-heading" className="sr-only">
          Why work with us
        </h2>

        {/**
         * Hairline dividers via `border-l` on all but the first item, only from
         * `md` up. A `divide-x` utility would draw a rule on the wrapped rows too
         * once the row becomes a 2x2 grid, which looks like a mistake.
         */}
        <ul className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 md:grid-cols-4">
          {ASSURANCES.map((assurance, index) => (
            <li
              key={assurance.title}
              className={[
                "flex items-start gap-3 md:px-6",
                index > 0 ? "md:border-l md:border-white/10" : "",
                index === 0 ? "md:pl-0" : "",
              ].join(" ")}
            >
              <assurance.icon
                className="mt-0.5 size-6 shrink-0 text-blue-400"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white">
                  {assurance.title}
                </h3>
                <p className="mt-1 text-[0.8rem] leading-snug text-gray-400">
                  {assurance.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
