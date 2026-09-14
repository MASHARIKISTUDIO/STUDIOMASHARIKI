import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { ServicePageContent } from "@/lib/service-pages";
import {
  breadcrumbSchema,
  jsonLdGraph,
  serviceLandingSchema,
} from "@/lib/seo";
import { absoluteUrl, serviceUrl } from "@/lib/site";
import { BeatsLayout } from "./beats";
import { BookingLayout } from "./booking";
import { DesignLayout } from "./design";
import { ServiceHero } from "./hero";
import { PhotographyLayout } from "./photography";
import { EnquireStrip } from "./shared";
import { StandardLayout } from "./standard";
import { VideoLayout } from "./video";

export function ServicePageScreen({ page }: { page: ServicePageContent }) {
  const jsonLd = jsonLdGraph(
    serviceLandingSchema(page),
    breadcrumbSchema([
      { name: "Home", url: absoluteUrl("/") },
      { name: page.title, url: serviceUrl(page.slug) },
    ]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <main className="flex-1 bg-gray-950">
        <ServiceHero page={page} />
        <ServiceBody page={page} />
        <EnquireStrip />
      </main>
      <SiteFooter />
    </>
  );
}

function ServiceBody({ page }: { page: ServicePageContent }) {
  switch (page.layout) {
    case "photography":
      return <PhotographyLayout page={page} />;
    case "beats":
      return <BeatsLayout page={page} />;
    case "design":
      return <DesignLayout page={page} />;
    case "booking":
      return <BookingLayout page={page} />;
    case "video":
      return <VideoLayout page={page} />;
    default:
      return <StandardLayout page={page} />;
  }
}
