import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ServicePageContent } from "@/lib/service-pages";
import { CyanCta, SectionLabel } from "./shared";

export function PhotographyLayout({ page }: { page: ServicePageContent }) {
  const offerings = page.offerings ?? [];
  const reasons = page.reasons ?? [];

  return (
    <>
      <section className="border-b border-white/10 py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionLabel>{page.offeringsHeading}</SectionLabel>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {offerings.map((item) => (
              <li key={item.title}>
                <Link
                  href="#enquire"
                  className="group relative flex h-full min-h-[11.5rem] flex-col overflow-hidden rounded-xl border border-cyan-400/25 bg-gray-950 shadow-[0_0_24px_-12px_rgba(34,211,238,0.45)] transition-colors hover:border-cyan-400/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                >
                  {item.image !== undefined ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-gray-950/20"
                  />
                  <div className="relative mt-auto flex items-end justify-between gap-3 p-4">
                    <div>
                      <item.icon
                        className="size-5 text-cyan-400"
                        aria-hidden="true"
                      />
                      <h3 className="mt-2 text-[0.8rem] font-bold uppercase tracking-[0.08em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-snug text-gray-300">
                        {item.text}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/50 text-cyan-400"
                    >
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/10 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-4xl uppercase tracking-wide text-cyan-400 sm:text-5xl">
            {page.reasonsHeading}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((item) => (
              <li key={item.title} className="flex gap-3">
                <item.icon
                  className="mt-0.5 size-6 shrink-0 text-cyan-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBanner page={page} />
    </>
  );
}

export function CtaBanner({ page }: { page: ServicePageContent }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_10%_50%,rgba(8,145,178,0.25),transparent_60%)]"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-12">
        <div>
          <p className="font-script text-3xl text-cyan-300 sm:text-4xl">
            {page.cta.script}
          </p>
          {page.cta.sub !== undefined ? (
            <p className="mt-2 max-w-md text-sm text-gray-300">{page.cta.sub}</p>
          ) : null}
        </div>
        <CyanCta href={page.cta.href}>{page.cta.label}</CyanCta>
      </div>
    </section>
  );
}
