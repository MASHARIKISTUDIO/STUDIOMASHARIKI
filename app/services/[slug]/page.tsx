import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageScreen } from "@/components/service-pages/screen";
import { getServicePage, listServicePageSlugs } from "@/lib/service-pages";
import { serviceUrl, siteConfig } from "@/lib/site";

/**
 * One landing page per service in `lib/service-pages.ts`.
 *
 * Booking is a top-level route (`/book-a-session`) because it also lives in the
 * primary nav, so that slug is excluded here. `dynamicParams = false` makes any
 * other path a 404 instead of an on-demand empty page.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return listServicePageSlugs()
    .filter((slug) => slug !== "book-a-session")
    .map((slug) => ({ slug }));
}

type ServiceLandingProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: ServiceLandingProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getServicePage(slug);

  if (page === undefined || slug === "book-a-session") {
    return {};
  }

  return {
    title: page.title,
    description: page.seoDescription,
    alternates: { canonical: serviceUrl(page.slug) },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: serviceUrl(page.slug),
      title: `${page.title} | ${siteConfig.name}`,
      description: page.seoDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | ${siteConfig.name}`,
      description: page.seoDescription,
    },
  };
}

export default async function ServiceLandingPage(props: ServiceLandingProps) {
  const { slug } = await props.params;
  const page = getServicePage(slug);

  if (page === undefined || slug === "book-a-session") {
    notFound();
  }

  return <ServicePageScreen page={page} />;
}
