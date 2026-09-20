"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { createContext, useContext, type ReactNode } from "react";

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
  const tree = !convex ? (
    <>{children}</>
  ) : clerkConfigured ? (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  ) : (
    <ConvexProvider client={convex}>{children}</ConvexProvider>
  );

  return (
    <ClerkConfiguredContext.Provider value={clerkConfigured}>
      {tree}
    </ClerkConfiguredContext.Provider>
  );
}
