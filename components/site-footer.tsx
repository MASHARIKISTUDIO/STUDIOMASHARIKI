import Link from "next/link";
import { CATEGORIES } from "@/convex/categories";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_2fr]">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-blue-400">
              Studio Mashariki
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-400">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              What we deliver
            </h2>
            {/* Also an internal-linking surface: every category page is
                reachable from every page of the site. */}
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="rounded text-sm text-gray-400 transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
          <p>Nairobi, Kenya · Serving East Africa and worldwide</p>
        </div>
      </div>
    </footer>
  );
}
