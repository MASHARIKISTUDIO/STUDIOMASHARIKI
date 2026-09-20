"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { createContext, useContext, type ReactNode } from "react";
import { SiteBooking } from "@/components/booking/site-booking";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Created once at module scope so the websocket survives client navigations.
 *
 * If the URL is missing we intentionally do NOT throw at import time, because
 * that would break `next build` for anyone who has not run `npx convex dev`
 * yet. Instead the app renders without a Convex connection and the dashboard
 * surfaces a clear message.
 */
export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const ClerkConfiguredContext = createContext(false);

/** Whether `<ClerkProvider>` is mounted. Sourced from the server layout. */
export function useClerkConfigured(): boolean {
  return useContext(ClerkConfiguredContext);
}

export function Providers({
  children,
  clerkConfigured,
}: {
  children: ReactNode;
  clerkConfigured: boolean;
}) {
  const withBooking = <SiteBooking>{children}</SiteBooking>;
  const tree = !convex ? (
    withBooking
  ) : clerkConfigured ? (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {withBooking}
    </ConvexProviderWithClerk>
  ) : (
    <ConvexProvider client={convex}>{withBooking}</ConvexProvider>
  );

  return (
    <ClerkConfiguredContext.Provider value={clerkConfigured}>
      {tree}
    </ClerkConfiguredContext.Provider>
  );
}
