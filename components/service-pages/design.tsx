import Image from "next/image";
import { STUDIO_LOGO } from "@/lib/partners";
import type { ServicePageContent } from "@/lib/service-pages";
import { CyanCta, SectionLabel } from "./shared";

const MOCKUPS = [
  { title: "Dream Create Achieve", tone: "from-cyan-400 to-blue-600" },
  { title: "Studio Mashariki", tone: "from-blue-700 to-gray-950" },
  { title: "Music Brings People Together", tone: "from-orange-500 to-rose-600" },
  { title: "Reggae Sunday", tone: "from-lime-400 to-emerald-700" },
] as const;

export function DesignLayout({ page }: { page: ServicePageContent }) {
  const offerings = page.offerings ?? [];

  return (
    <>
      <section className="border-b border-white/10 py-10 lg:py-12">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div>
            <SectionLabel className="justify-start">
              {page.offeringsHeading}
            </SectionLabel>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {offerings.map((item) => (
                <li key={item.title}>
                  <article className="flex h-full gap-3 rounded-xl border border-cyan-400/25 bg-gray-950 p-4 shadow-[0_0_20px_-12px_rgba(34,211,238,0.4)]">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 text-cyan-400">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-snug text-gray-400">
                        {item.text}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="grid grid-cols-2 gap-3">
              {MOCKUPS.map((card, index) => (
                <article
                  key={card.title}
                  className={`relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${card.tone} p-4 shadow-soft-lg ${index === 1 ? "mt-6" : ""} ${index === 2 ? "-mt-4" : ""}`}
                >
                  <Image
                    src={STUDIO_LOGO.src}
                    alt=""
                    width={48}
                    height={48}
                    className="size-8 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                  />
                  <p className="mt-6 font-display text-2xl uppercase leading-none tracking-wide text-white">
                    {card.title}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-script text-4xl text-cyan-300 sm:text-5xl">
              {page.cta.script}
            </p>
            {page.cta.sub !== undefined ? (
              <p className="mt-3 max-w-md text-sm text-gray-300">
                {page.cta.sub}
              </p>
            ) : null}
          </div>
          <CyanCta href={page.cta.href}>{page.cta.label}</CyanCta>
        </div>
      </section>
    </>
  );
}
