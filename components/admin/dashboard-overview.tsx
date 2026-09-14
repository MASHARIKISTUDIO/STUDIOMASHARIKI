"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { convex } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export function DashboardOverview() {
  const me = useQuery(api.users.current, convex ? {} : "skip");
  const isAdmin = me?.role === "admin";

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/40 p-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 max-w-xl text-sm text-gray-400">
        Session bookings from the public calendar land here as WhatsApp
        requests. Admins set busy hours and the studio WhatsApp number on the
        session hours board.
      </p>
      {isAdmin ? (
        <Button asChild className="mt-5">
          <Link href="/dashboard/admin/availability">Open session hours</Link>
        </Button>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          Availability is managed by studio admins.
        </p>
      )}
    </div>
  );
}
