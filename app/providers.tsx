"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

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

export function Providers({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
