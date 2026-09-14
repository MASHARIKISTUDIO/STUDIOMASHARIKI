"use client";

import { useUser } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/navigation";
import { SERVICES } from "@/lib/services";

/**
 * The header's menu button and the panel it opens.
 *
 * Visible at every breakpoint, which is what the design shows: on a phone it is
 * the only navigation, and on desktop it sits beside the nav as the way into the
 * full service list and the account actions. Those account actions are the
 * reason this component exists at all rather than the nav simply collapsing -
 * the header design has no room for sign-in buttons, so they live in here.
 *
 * Auth state is read with `useUser()` rather than Clerk's `<Show>`. `<Show>` is a
 * Server Component in `@clerk/nextjs@7` (it is re-exported from
 * `app-router/server/controlComponents`) and cannot be rendered inside a Client
 * Component like this one.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { isLoaded, isSignedIn } = useUser();

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the trigger, otherwise closing the panel leaves focus on
    // a removed node and the next Tab starts from the top of the document.
    buttonRef.current?.focus();
  }, []);

  // Escape closes from anywhere, including from inside the panel.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Pointer down outside the panel and outside the trigger closes it.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) !== true &&
        buttonRef.current?.contains(target) !== true
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /**
   * Freeze background scrolling while the panel is open.
   *
   * The previous value is captured and restored rather than reset to `""`, so
   * this cannot clobber an `overflow` set by something else (a modal, say).
   */
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex size-9 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          /**
           * Anchored to the sticky header (`top-16 = h-16`) and scrollable in its
           * own right, because on a short phone screen the eleven services plus
           * six nav items are taller than the viewport.
           */
          className="fixed inset-x-0 top-16 z-50 max-h-[calc(100svh-4rem)] overflow-y-auto border-b border-white/10 bg-gray-950/98 backdrop-blur-md"
        >
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex items-start justify-between gap-6">
              <nav aria-label="Site" className="min-w-0">
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={close}
                        className="-mx-2 block rounded-lg px-2 py-2 text-base font-medium uppercase tracking-[0.1em] text-gray-200 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <h2 className="mt-8 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-blue-400">
              Services
            </h2>
            <ul className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={service.href}
                    onClick={close}
                    className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-blue-500/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              {/* Rendered only once Clerk has resolved, so a signed-in visitor
                  never sees "Sign in" flash before their dashboard link. */}
              {isLoaded ? (
                isSignedIn ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard" onClick={close}>
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="sm" variant="ghost" className="text-gray-300">
                      <Link href="/sign-in" onClick={close}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/sign-up" onClick={close}>
                        Create account
                      </Link>
                    </Button>
                  </>
                )
              ) : null}

              <SocialLinks className="ml-auto flex items-center gap-1 sm:hidden" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
