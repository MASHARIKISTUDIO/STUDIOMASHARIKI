import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ServicePageContent } from "@/lib/service-pages";
import { PaintStroke } from "./shared";

export function ServiceHero({ page }: { page: ServicePageContent }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <Image
        src={page.heroImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/88 to-gray-950/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/40"
      />

      <p className="pointer-events-none absolute right-6 top-10 hidden max-w-[10rem] text-right font-script text-2xl leading-tight text-cyan-300 [text-shadow:0_0_24px_rgba(34,211,238,0.45)] lg:block xl:right-16 xl:max-w-xs xl:text-3xl">
        {page.flourish}
      </p>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <nav aria-label="Breadcrumb">
          <Link
            href={page.backHref}
            className="inline-flex items-center gap-1.5 rounded text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cyan-400 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {page.backLabel}
          </Link>
        </nav>

        <div className="mt-6 max-w-xl lg:max-w-2xl">
          <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-wide text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl">
            {page.title}
          </h1>
          <PaintStroke className="mt-2" />

          <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cyan-300 sm:text-xs">
            {page.kicker}
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-200 sm:text-base">
            {page.description}
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
            {page.highlights.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gray-200 sm:text-[0.7rem]"
              >
                <item.icon
                  className="size-4 shrink-0 text-cyan-400"
                  aria-hidden="true"
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
