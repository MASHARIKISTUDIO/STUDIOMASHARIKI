import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageScreen } from "@/components/service-pages/screen";
import { getServicePage } from "@/lib/service-pages";
import { serviceUrl, siteConfig } from "@/lib/site";

const page = getServicePage("book-a-session");

export const metadata: Metadata = {
  title: page?.title ?? "Book a Session",
  description: page?.seoDescription,
  alternates: { canonical: serviceUrl("book-a-session") },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: serviceUrl("book-a-session"),
    title: `${page?.title ?? "Book a Session"} | ${siteConfig.name}`,
    description: page?.seoDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${page?.title ?? "Book a Session"} | ${siteConfig.name}`,
    description: page?.seoDescription,
  },
};

export default function BookASessionPage() {
  if (page === undefined) {
    notFound();
  }

  return <ServicePageScreen page={page} />;
}
