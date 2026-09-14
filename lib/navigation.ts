/**
 * Primary navigation, shared by the desktop nav and the mobile drawer.
 *
 * ⚠️ `#about` and `#contact` do not exist as sections yet. The design these
 * links come from is taller than the reference screenshot, so those sections
 * are still to be built. Until then the links are inert - an in-page anchor
 * with no matching `id` simply does not scroll, it does not 404 - but they
 * should not ship to production in that state. Either build the sections or
 * drop the items.
 *
 * "Book a Session" and "Gallery" are real routes. `hasDropdown` drives the
 * chevron and the services panel; only "Services" has children today, and they
 * come from `SERVICES` in `lib/services.ts`.
 */
export type NavLink = {
  href: string;
  label: string;
  hasDropdown?: boolean;
};

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/book-a-session", label: "Book a Session" },
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services", hasDropdown: true },
  { href: "/galleries", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
] as const;

/**
 * Whether a nav link should read as current.
 *
 * Compares pathname only. Homepage anchors all share the `/` path, so matching
 * on `href` directly would mark every one of them active at once on `/`.
 * Service landing pages live under `/services/...`, which should light up
 * "Services". Booking and the gallery index are their own routes and should
 * light up only those items.
 */
export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === "/#services") {
    return pathname.startsWith("/services");
  }
  const path = href.split("#")[0] || "/";
  if (path === "/") {
    return pathname === "/";
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
