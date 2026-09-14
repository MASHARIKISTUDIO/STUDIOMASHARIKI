import { ServiceCard } from "@/components/service-card";
import { SERVICES } from "@/lib/services";

/**
 * The services grid.
 *
 * The design runs 5 tiles on the first row and 6 on the second, which is a
 * deliberate visual rhythm rather than an accident of wrapping - the wide Events
 * tile ends the first row. Reproducing it with two fixed rows would break badly
 * at every width in between, so this uses one grid that steps
 * 1 -> 2 -> 3 -> 5 columns; at the design's own width the eleven items land 5 and
 * then 6, matching the reference, and at every other width they simply reflow.
 */
export function ServicesGrid() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="border-b border-white/10 py-10 lg:py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* The design shows no visible heading above the grid - the tiles speak
            for themselves - but the section still needs an accessible name, so
            the heading is available to assistive tech only. */}
        <h2 id="services-heading" className="sr-only">
          What we do
        </h2>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SERVICES.map((service) => (
            <li key={service.slug} className="flex">
              <ServiceCard
                service={service}
                imageSizes="(min-width: 1280px) 220px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
