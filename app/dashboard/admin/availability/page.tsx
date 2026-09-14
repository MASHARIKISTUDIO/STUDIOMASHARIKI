import type { Metadata } from "next";
import { AvailabilityBoard } from "@/components/admin/availability-board";

export const metadata: Metadata = {
  title: "Session hours",
  robots: { index: false, follow: false },
};

export default function AvailabilityPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white">Session hours</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-400">
        Mark hours busy when the room is taken. Visitors only see free times,
        then send the appointment on WhatsApp.
      </p>
      <div className="mt-6">
        <AvailabilityBoard />
      </div>
    </div>
  );
}
