import { Check } from "lucide-react";
import Image from "next/image";
import type { ServicePageContent } from "@/lib/service-pages";
import { CtaBanner } from "./photography";
import { CyanCta, SectionLabel } from "./shared";

export function BeatsLayout({ page }: { page: ServicePageContent }) {
  const packs = page.packs ?? [];
  const rates = page.rates ?? [];
  const steps = page.process ?? [];

  return (
    <>
      <section className="border-b border-white/10 py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionLabel>{page.packsHeading}</SectionLabel>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <li key={pack.title}>
                <article className="flex h-full overflow-hidden rounded-xl border border-cyan-400/25 bg-gray-950 shadow-[0_0_24px_-12px_rgba(34,211,238,0.4)]">
                  <div className="relative w-28 shrink-0 sm:w-32">
                    {pack.image !== undefined ? (
                      <Image
                        src={pack.image}
                        alt=""
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <div className="flex items-center gap-2">
                      <pack.icon
                        className="size-4 text-cyan-400"
                        aria-hidden="true"
                      />
                      <h3 className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-white">
                        {pack.title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-xs leading-snug text-gray-400">
                      {pack.text}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/10 py-10 lg:py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <SectionLabel className="justify-start">
              {page.ratesHeading}
            </SectionLabel>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {rates.map((rate) => (
                <li key={rate.title}>
                  <article
                    className={
                      rate.featured === true
                        ? "flex h-full flex-col rounded-xl border-2 border-cyan-400 bg-cyan-400/10 p-5 shadow-[0_0_32px_-8px_rgba(34,211,238,0.7)]"
                        : "flex h-full flex-col rounded-xl border border-cyan-400/25 bg-gray-950 p-5"
                    }
                  >
                    <rate.icon
                      className="size-6 text-cyan-400"
                      aria-hidden="true"
                    />
                    <h3 className="mt-3 text-sm font-bold uppercase tracking-[0.08em] text-white">
                      {rate.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">{rate.detail}</p>
                    <p className="mt-4 font-display text-2xl tracking-wide text-cyan-300">
                      {rate.price}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
            {page.rateNotes !== undefined ? (
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {page.rateNotes.map((note) => (
                  <li
                    key={note}
                    className="flex items-center gap-1.5 text-xs text-gray-300"
                  >
                    <Check
                      className="size-3.5 text-cyan-400"
                      aria-hidden="true"
                    />
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <SectionLabel>{page.processHeading}</SectionLabel>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 text-cyan-400">
                    <step.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="font-script text-2xl text-cyan-300">
                Custom beats. Real vibes.
              </p>
              <CyanCta href={page.cta.href}>{page.cta.label}</CyanCta>
            </div>
          </div>
        </div>
      </section>

      {page.footerTags !== undefined ? (
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-400/80 sm:px-6">
          {page.footerTags.join("  ·  ")}
        </p>
      ) : (
        <CtaBanner page={page} />
      )}
    </>
  );
}
