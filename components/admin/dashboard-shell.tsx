"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect } from "react";
import { convex, useClerkConfigured } from "@/app/providers";
import { api } from "@/convex/_generated/api";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const clerkConfigured = useClerkConfigured();
  return (
    <div className="flex-1 bg-gray-950">
      {convex && clerkConfigured ? <EnsureUser /> : null}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
        {convex ? <DashboardNav /> : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function EnsureUser() {
  const { isSignedIn } = useAuth();
  const store = useMutation(api.users.store);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    void store();
  }, [isSignedIn, store]);

  return null;
}

function DashboardNav() {
  const me = useQuery(api.users.current);
  const isAdmin = me?.role === "admin";

  return (
    <nav aria-label="Dashboard" className="w-full shrink-0 lg:w-52">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
        Dashboard
      </p>
      <ul className="mt-3 flex flex-row gap-2 lg:flex-col">
        <li>
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Overview
          </Link>
        </li>
        {isAdmin ? (
          <>
            <li>
              <Link
                href="/dashboard/admin/availability"
                className="block rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Session hours
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/admin/hero"
                className="block rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Hero videos
              </Link>
            </li>
          </>
        ) : null}
      </ul>
    </nav>
  );
}
