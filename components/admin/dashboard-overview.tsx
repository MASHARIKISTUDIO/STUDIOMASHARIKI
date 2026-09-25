"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { convex } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export function DashboardOverview() {
  if (!convex) {
    return <OverviewCopy isAdmin={false} />;
  }
  return <DashboardOverviewConnected />;
}

function DashboardOverviewConnected() {
  const me = useQuery(api.users.current);
  return <OverviewCopy isAdmin={me?.role === "admin"} />;
}

function OverviewCopy({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/40 p-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 max-w-xl text-sm text-gray-400">
        Session bookings from the public calendar land here as WhatsApp
        requests. Admins set busy hours, the studio WhatsApp number, and the
        homepage and gallery hero videos.
      </p>
      {isAdmin ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/availability">Open session hours</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/admin/hero">Hero videos</Link>
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          Availability is managed by studio admins.
        </p>
      )}
    </div>
  );
}
