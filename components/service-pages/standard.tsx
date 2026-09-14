import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ServicePageContent } from "@/lib/service-pages";
import { CtaBanner } from "./photography";
import { SectionLabel } from "./shared";

export function StandardLayout({ page }: { page: ServicePageContent }) {
  const offerings = page.offerings ?? [];
  const rates = page.rates ?? [];
  const steps = page.process ?? [];

  return (
    <>
      {offerings.length > 0 ? (
        <section className="border-b border-white/10 py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionLabel>{page.offeringsHeading}</SectionLabel>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {offerings.map((item) => {
                const inner = (
                  <>
                    <item.icon
                      className="size-6 text-cyan-400"
                      aria-hidden="true"
                    />
                    <h3 className="mt-3 text-[0.8rem] font-bold uppercase tracking-[0.08em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-gray-400">
                      {item.text}
                    </p>
                    {item.href !== undefined ? (
                      <span
                        aria-hidden="true"
                        className="mt-3 inline-flex size-8 items-center justify-center rounded-full border border-cyan-400/40 text-cyan-400"
                      >
                        <ArrowRight className="size-3.5" />
                      </span>
                    ) : null}
                  </>
                );

                return (
                  <li key={item.title}>
                    {item.href !== undefined ? (
                      <Link
                        href={item.href}
                        className="flex h-full flex-col rounded-xl border border-cyan-400/25 bg-gray-950 p-5 shadow-[0_0_20px_-12px_rgba(34,211,238,0.4)] transition-colors hover:border-cyan-400/70"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <article className="flex h-full flex-col rounded-xl border border-cyan-400/25 bg-gray-950 p-5 shadow-[0_0_20px_-12px_rgba(34,211,238,0.4)]">
                        {inner}
                      </article>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {rates.length > 0 ? (
        <section className="border-b border-white/10 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionLabel>{page.ratesHeading}</SectionLabel>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {rates.map((rate) => (
                <li key={rate.title}>
                  <article
                    className={
                      rate.featured === true
                        ? "rounded-xl border-2 border-cyan-400 bg-cyan-400/10 p-5"
                        : "rounded-xl border border-cyan-400/25 bg-gray-950 p-5"
                    }
                  >
                    <rate.icon
                      className="size-6 text-cyan-400"
                      aria-hidden="true"
                    />
                    <h3 className="mt-3 text-sm font-bold uppercase text-white">
                      {rate.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">{rate.detail}</p>
                    <p className="mt-4 font-display text-2xl text-cyan-300">
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
        </section>
      ) : null}

      {steps.length > 0 ? (
        <section className="border-b border-white/10 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionLabel>{page.processHeading}</SectionLabel>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>
      ) : null}

      <CtaBanner page={page} />
    </>
  );
}
