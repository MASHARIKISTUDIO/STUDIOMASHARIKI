import type { Metadata } from "next";
import { AssuranceStrip } from "@/components/assurance-strip";
import { GalleryStrip } from "@/components/gallery-strip";
import { HomeHero } from "@/components/home-hero";
import { JsonLd } from "@/components/json-ld";
import { PartnerMarquee } from "@/components/partner-marquee";
import { ServicesGrid } from "@/components/services-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES } from "@/convex/categories";
import { listPublicGalleries } from "@/lib/convex-server";
import {
  categoryItemListSchema,
  jsonLdGraph,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  keywords: [
    "recording studio nairobi",
    "mixing and mastering kenya",
    "beat production",
    "music video production",
    // The service menu and the gallery taxonomy are different lists, and both
    // describe what this page is about, so both feed the keywords.
    ...SERVICES.map((service) => service.title.toLowerCase()),
    ...CATEGORIES.flatMap((category) => category.keywords),
  ],
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: absoluteUrl("/"),
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export default async function HomePage() {
  // Seven, because that is how many tiles the gallery strip shows.
  const galleries = await listPublicGalleries({ limit: 7 });

  const jsonLd = jsonLdGraph(
    organizationSchema(),
    websiteSchema(),
    categoryItemListSchema(),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />

      <main className="flex-1 bg-gray-950">
        <HomeHero />
        <ServicesGrid />
        <AssuranceStrip />
        <GalleryStrip galleries={galleries} />
        {/* Social proof closes the page, after the work it is vouching for. */}
        <PartnerMarquee />
      </main>

      <SiteFooter />
    </>
  );
}
