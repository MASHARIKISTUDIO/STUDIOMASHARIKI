import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryCard } from "@/components/gallery-card";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  CATEGORIES,
  CATEGORY_META,
  isGalleryCategory,
} from "@/convex/categories";
import { listPublicGalleries } from "@/lib/convex-server";
import {
  breadcrumbSchema,
  collectionPageSchema,
  jsonLdGraph,
} from "@/lib/seo";
import { absoluteUrl, categoryUrl, siteConfig } from "@/lib/site";

/**
 * SEO landing page per product category - the "relevant SEO landing section"
 * each product card in the homepage grid points at.
 *
 * All 12 slugs are known at build time, so they are prerendered via
 * `generateStaticParams`; `dynamicParams = false` makes any other slug a 404
 * instead of an on-demand render, which stops crawlers manufacturing thin pages
 * from junk URLs.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata(
  props: PageProps<"/categories/[category]">,
): Promise<Metadata> {
  // Next.js 16: `params` is a Promise and must be awaited.
  const { category: slug } = await props.params;

  if (!isGalleryCategory(slug)) {
    return {};
  }

  const category = CATEGORY_META[slug];
  const title = `${category.label} Films & Galleries`;

  return {
    title,
    description: category.description,
    keywords: category.keywords,
    alternates: { canonical: categoryUrl(slug) },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: categoryUrl(slug),
      title: `${title} | ${siteConfig.name}`,
      description: category.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description: category.description,
    },
  };
}

export default async function CategoryPage(
  props: PageProps<"/categories/[category]">,
) {
  const { category: slug } = await props.params;

  if (!isGalleryCategory(slug)) {
    notFound();
  }

  const category = CATEGORY_META[slug];
  const galleries = await listPublicGalleries({ category: slug, limit: 24 });

  const jsonLd = jsonLdGraph(
    collectionPageSchema(category),
    breadcrumbSchema([
      { name: "Home", url: absoluteUrl("/") },
      { name: category.label, url: categoryUrl(slug) },
    ]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />

      <main className="flex-1 bg-gray-950">
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.18),transparent_70%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            {/* Visible breadcrumb mirrors the BreadcrumbList JSON-LD. */}
            <nav aria-label="Breadcrumb">
              <Link
                href="/#products"
                className="inline-flex items-center gap-1.5 rounded text-sm text-gray-400 transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                All products
              </Link>
            </nav>

            <h1 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {category.label}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-300">
              {category.description}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="category-galleries-heading"
          className="py-16 lg:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="category-galleries-heading"
              className="text-2xl font-semibold tracking-tight text-white"
            >
              {category.label} galleries
            </h2>

            {galleries.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {galleries.map((gallery) => (
                  <GalleryCard key={gallery._id} gallery={gallery} />
                ))}
              </div>
            ) : (
              <p className="mt-10 rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-gray-500">
                No public {category.label} galleries published yet.
              </p>
            )}

            <div className="mt-16 border-t border-white/10 pt-10">
              <h2 className="text-sm font-semibold text-white">
                Other things we film
              </h2>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {CATEGORIES.filter((other) => other.slug !== slug).map(
                  (other) => (
                    <li key={other.slug}>
                      <Link
                        href={`/categories/${other.slug}`}
                        className="rounded text-sm text-gray-400 transition-colors hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        {other.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
