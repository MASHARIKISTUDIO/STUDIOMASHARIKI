import Image from "next/image";
import { BookNowButton, BookSessionCta } from "@/components/booking/book-now-button";
import { BookingModal } from "@/components/booking/booking-modal";
import { BookingProvider } from "@/components/booking/booking-provider";
import {
  nairobiDateString,
  nairobiMinutesFromMidnight,
} from "@/lib/booking";
import type { ServicePageContent } from "@/lib/service-pages";
import { SectionLabel } from "./shared";

export function BookingLayout({ page }: { page: ServicePageContent }) {
  const offers = page.bookingOffers ?? [];
  const products = offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    price: offer.price,
  }));
  // Request-time snapshot so the calendar can hide past hours. The mutation
  // still re-checks on the server, so a slightly stale snapshot cannot book.
  // eslint-disable-next-line react-hooks/purity -- server snapshot, not a render tick
  const now = Date.now();
  const today = nairobiDateString(now);
  const nowMinutes = nairobiMinutesFromMidnight(now);

  return (
    <BookingProvider>
      <section className="border-b border-white/10 py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionLabel className="justify-start">
            {page.bookingHeading}
          </SectionLabel>

          <ul className="mt-8 grid gap-4 lg:grid-cols-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-cyan-400/30 bg-gray-950 shadow-[0_0_28px_-12px_rgba(34,211,238,0.5)]">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={offer.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-2">
                    <div className="flex items-start gap-3">
                      <offer.icon
                        className="mt-0.5 size-6 shrink-0 text-cyan-400"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-[0.06em] text-white">
                          {offer.title}
                        </h3>
                        <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                          {offer.kicker}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
                      {offer.text}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="rounded-full bg-cyan-400 px-4 py-1.5 font-display text-xl tracking-wide text-gray-950">
                        <span className="mr-1 text-[0.6rem] font-sans font-bold uppercase tracking-[0.16em]">
                          Rate
                        </span>
                        {offer.price}
                      </p>
                      <BookNowButton
                        product={{
                          id: offer.id,
                          title: offer.title,
                          price: offer.price,
                        }}
                      />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-script text-3xl text-cyan-300 sm:text-4xl">
            {page.cta.script}
          </p>
          <BookSessionCta>{page.cta.label}</BookSessionCta>
        </div>
      </section>

      <BookingModal products={products} today={today} nowMinutes={nowMinutes} />
    </BookingProvider>
  );
}
