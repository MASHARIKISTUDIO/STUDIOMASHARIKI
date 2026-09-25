import type { Metadata } from "next";
import { HeroVideosForm } from "@/components/admin/hero-videos";

export const metadata: Metadata = {
  title: "Hero videos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function HeroVideosPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white">Hero videos</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-400">
        Set the background video for the homepage and the gallery. Each one
        loops, stays muted, and sits behind the headline. Leave a page empty
        to keep the gradient.
      </p>
      <div className="mt-6">
        <HeroVideosForm />
      </div>
    </div>
  );
}
