import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ServicePageContent, VideoTier } from "@/lib/service-pages";
import { CyanCta, SectionLabel } from "./shared";

export function VideoLayout({ page }: { page: ServicePageContent }) {
  const tiers = page.videoTiers ?? [];
  const steps = page.process ?? [];

  return (
    <>
      <section className="border-b border-white/10 py-10 lg:py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6">
          {tiers.map((tier) => (
            <VideoTierBlock key={tier.id} tier={tier} />
          ))}
        </div>
      </section>

      <section className="border-b border-white/10 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionLabel>{page.processHeading}</SectionLabel>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-3">
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-10 hidden h-px w-[calc(100%-1.25rem)] bg-cyan-400/30 lg:block"
                  />
                ) : null}
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/50 bg-gray-950 text-cyan-400">
                  <step.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-end">
            <CyanCta href={page.cta.href}>{page.cta.label}</CyanCta>
          </div>
        </div>
      </section>
    </>
  );
}

function VideoTierBlock({ tier }: { tier: VideoTier }) {
  const gold = tier.theme === "gold";
  const border = gold ? "border-amber-400/40" : "border-cyan-400/30";
  const glow = gold
    ? "shadow-[0_0_32px_-10px_rgba(251,191,36,0.45)]"
    : "shadow-[0_0_32px_-10px_rgba(34,211,238,0.45)]";
  const accent = gold ? "text-amber-300" : "text-cyan-300";
  const badgeBg = gold
    ? "bg-gradient-to-br from-amber-200 to-amber-600 text-gray-950"
    : "bg-gray-900 text-cyan-300 border border-cyan-400/40";

  return (
    <article
      id={tier.id}
      className={`overflow-hidden rounded-2xl border ${border} bg-gray-950 ${glow}`}
    >
      <div className="grid lg:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col justify-center border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:border-white/10 lg:p-8">
          <div className="flex items-center gap-4">
            <span
              className={`flex size-20 shrink-0 items-center justify-center rounded-xl font-display text-4xl ${badgeBg}`}
            >
              {tier.label}
            </span>
            <div>
              <p className={`font-display text-2xl uppercase tracking-wide ${accent}`}>
                {tier.badge === "Ultra HD" ? "4K Production" : "HD Production"}
              </p>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gray-400">
                {tier.kicker}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-300">
            {tier.text}
          </p>
          <Link
            href={`#${tier.id}-grid`}
            className={`mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] ${accent} transition-colors hover:text-white`}
          >
            Explore {tier.label} services
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <ul
          id={`${tier.id}-grid`}
          className="grid gap-2 p-3 sm:grid-cols-2 lg:p-4"
        >
          {tier.services.map((item) => (
            <li key={`${tier.id}-${item.title}`}>
              <Link
                href={item.href}
                className="group flex h-full items-start gap-3 rounded-xl border border-white/10 bg-gray-900/60 p-3 transition-colors hover:border-cyan-400/50 hover:bg-gray-900"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 text-cyan-400">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] leading-snug text-gray-400">
                    {item.text}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
