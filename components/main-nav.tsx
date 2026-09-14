"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavLinkActive, NAV_LINKS } from "@/lib/navigation";
import { SERVICES } from "@/lib/services";

/**
 * Desktop navigation.
 *
 * A Client Component only because of `usePathname()` for the active-link
 * underline. The services dropdown itself is deliberately CSS-only - opened by
 * `group-hover` and `group-focus-within` - so it needs no open/close state, no
 * outside-click listener and no portal.
 *
 * Keyboard path: Tab reaches the "Services" link, `focus-within` opens the
 * panel, and Tab continues into the eleven service links. Touch path: tapping
 * "Services" follows the link to the `#services` grid, which is the same
 * destination the panel's items lead to; the mobile drawer lists them
 * explicitly. That avoids the usual hover-menu trap where a touch user can never
 * reach the children.
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden items-center gap-4 xl:gap-7 lg:flex">
      {NAV_LINKS.map((link) => {
        const active = isNavLinkActive(link.href, pathname);

        if (link.hasDropdown !== true) {
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              {link.label}
              <Underline active={active} />
            </Link>
          );
        }

        return (
          <div key={link.href} className="group relative">
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`${navLinkClass(active)} gap-1`}
            >
              {link.label}
              <ChevronDown
                className="size-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                aria-hidden="true"
              />
              <Underline active={active} />
            </Link>

            {/**
             * `invisible` + `opacity-0` rather than `hidden`, so the panel can
             * transition and so its links stay in the tab order for
             * `focus-within` to catch. `pt-3` on the wrapper keeps a hoverable
             * bridge between the trigger and the panel - without it the menu
             * closes in the gap as the pointer travels down.
             */}
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <ul className="grid w-[26rem] grid-cols-2 gap-1 rounded-xl border border-white/10 bg-gray-900/95 p-2 shadow-soft-lg backdrop-blur-md">
                {SERVICES.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={service.href}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] text-gray-300 transition-colors hover:bg-blue-500/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      <service.icon
                        className="size-4 shrink-0 text-blue-400"
                        aria-hidden="true"
                      />
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function navLinkClass(active: boolean): string {
  return [
    "relative inline-flex items-center rounded text-[0.8rem] font-medium uppercase tracking-[0.1em] transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500",
    active ? "text-blue-400" : "text-gray-300 hover:text-white",
  ].join(" ");
}

/**
 * The active-state rule under the current item.
 *
 * Rendered as an element rather than a `border-b` so it can sit clear of the
 * text baseline and not shift the label by a pixel when it appears.
 */
function Underline({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }
  return (
    <span
      aria-hidden="true"
      className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-blue-500"
    />
  );
}
