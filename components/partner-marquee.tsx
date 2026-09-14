import Image from "next/image";
import { PARTNERS, type Partner } from "@/lib/partners";

/**
 * Continuously scrolling "worked with" logo strip.
 *
 * Implementation notes:
 *
 *  - CSS-only. No JS, no carousel library, no client component. The animation is
 *    a single `translateX(-50%)` over a doubled list, which the compositor can
 *    run off the main thread. A JS slider here would ship a dependency and a
 *    hydration cost to animate four logos.
 *
 *  - The list is rendered twice. The second copy is `aria-hidden`, so screen
 *    readers announce each partner once while the visual loop stays seamless.
 *
 *  - `motion-reduce:` disables the animation and hands the strip back to the
 *    user as a normally scrollable region. An infinite marquee is exactly the
 *    kind of persistent motion WCAG 2.2.2 asks us to make stoppable, and for a
 *    vestibular-sensitive visitor it is genuinely unpleasant.
 *
 *  - Hover pauses. The logos are not links today, but pausing is what lets
 *    someone actually read a name they recognised mid-scroll.
 */
function LogoTile({ partner }: { partner: Partner }) {
  return (
    <li className="flex shrink-0 items-center justify-center px-8 sm:px-12">
      <Image
        src={partner.logo}
        alt={`${partner.name} logo`}
        width={partner.width}
        height={partner.height}
        sizes="180px"
        className={[
          // Uniform optical size: constrain HEIGHT and let width follow, so a
          // portrait logo and a landscape one read as equally prominent. Sizing
          // by width would make the tall Director Bito mark tower over the rest.
          "h-14 w-auto object-contain sm:h-16",
          // The logos are metallic gold on transparent. Dimming them slightly at
          // rest keeps the strip from competing with the hero, and full opacity
          // on hover rewards the pause.
          "opacity-70 transition-opacity duration-300 group-hover/marquee:opacity-100",
        ].join(" ")}
      />
    </li>
  );
}

export function PartnerMarquee() {
  /**
   * The -50% loop requires each half to be at least as wide as the viewport,
   * otherwise a gap scrolls into view on wide screens. With only three partners
   * one pass is roughly 1000px, so each half repeats the list twice (~2100px)
   * and comfortably covers a 1920px display.
   *
   * Derived from the list length rather than hardcoded, so the strip keeps
   * working if partners are added later.
   */
  const passesPerHalf = PARTNERS.length >= 6 ? 1 : 2;
  const half = Array.from({ length: passesPerHalf }, () => PARTNERS).flat();

  // Speed scales with the content so adding a partner does not silently make
  // the strip whip past faster.
  const durationSeconds = Math.max(24, half.length * 8);

  return (
    <section
      aria-labelledby="partners-heading"
      className="border-b border-white/10 bg-gray-950 py-14 lg:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="partners-heading"
          className="text-center text-[0.7rem] font-medium uppercase tracking-[0.28em] text-blue-400"
        >
          Worked with
        </h2>
      </div>

      <div
        className={[
          "group/marquee relative mt-10",
          // Feathered edges so logos fade out instead of being chopped by the
          // viewport. `mask-image` rather than gradient overlays, which would
          // need to hardcode the background colour and break on any section
          // whose background differs.
          "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
          // With reduced motion the strip becomes a plain scroller, so the mask
          // would hide the scrollable overflow cue. Drop it in that mode.
          "motion-reduce:[mask-image:none] motion-reduce:overflow-x-auto",
        ].join(" ")}
      >
        <div
          className={[
            "flex w-max",
            "animate-marquee hover:[animation-play-state:paused]",
            "motion-reduce:animate-none",
          ].join(" ")}
          style={
            { "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties
          }
        >
          <ul className="flex items-center">
            {half.map((partner, index) => (
              <LogoTile key={`a-${partner.name}-${index}`} partner={partner} />
            ))}
          </ul>

          {/* Second half: purely visual, so it is hidden from assistive tech. */}
          <ul className="flex items-center" aria-hidden="true">
            {half.map((partner, index) => (
              <LogoTile key={`b-${partner.name}-${index}`} partner={partner} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
