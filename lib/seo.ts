import type { CategoryMeta } from "@/convex/categories";
import { CATEGORIES } from "@/convex/categories";
import type { ServicePageContent } from "./service-pages";
import { absoluteUrl, categoryUrl, serviceUrl, siteConfig, siteUrl } from "./site";

/**
 * JSON-LD builders.
 *
 * Deliberate omissions: no `sameAs` social profiles, no `SearchAction`, no
 * `aggregateRating`, and no telephone/postal address. Emitting structured data
 * for things that do not exist (a site search, review counts, unverified social
 * accounts) is a Google structured-data violation, so those are left out until
 * real values are configured.
 */

const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;

/** Stable `@id` references let separate nodes point at one another. */
export const schemaIds = {
  organization: ORGANIZATION_ID,
  website: WEBSITE_ID,
} as const;

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteUrl,
    description: siteConfig.description,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/opengraph-image"),
    },
    image: absoluteUrl("/opengraph-image"),
    areaServed: siteConfig.areaServed.map((name) => ({
      "@type": "Place",
      name,
    })),
    // Signals topical relevance for the 12 products without inventing offers.
    knowsAbout: CATEGORIES.map((category) => category.label),
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * The service catalogue as an ItemList - this is what ties the 12 categories
 * into structured data rather than leaving them as plain markup.
 */
export function categoryItemListSchema() {
  return {
    "@type": "ItemList",
    "@id": `${siteUrl}/#products`,
    name: `${siteConfig.name} production and delivery services`,
    numberOfItems: CATEGORIES.length,
    itemListElement: CATEGORIES.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: category.label,
        description: category.description,
        url: categoryUrl(category.slug),
        serviceType: category.label,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: siteConfig.areaServed.map((name) => ({
          "@type": "Place",
          name,
        })),
      },
    })),
  };
}

/** Breadcrumbs for a category landing page. */
export function breadcrumbSchema(
  trail: Array<{ name: string; url: string }>,
): object {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function collectionPageSchema(category: CategoryMeta) {
  return {
    "@type": "CollectionPage",
    "@id": `${categoryUrl(category.slug)}#collection`,
    url: categoryUrl(category.slug),
    name: `${category.label} | ${siteConfig.name}`,
    description: category.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: {
      "@type": "Service",
      name: category.label,
      description: category.description,
      provider: { "@id": ORGANIZATION_ID },
    },
  };
}

/** Service landing page as a schema.org Service, plus the WebPage wrapper. */
export function serviceLandingSchema(page: ServicePageContent) {
  const url = serviceUrl(page.slug);
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: `${page.title} | ${siteConfig.name}`,
    description: page.seoDescription,
    isPartOf: { "@id": WEBSITE_ID },
    about: {
      "@type": "Service",
      name: page.title,
      description: page.seoDescription,
      url,
      serviceType: page.title,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: siteConfig.areaServed.map((name) => ({
        "@type": "Place",
        name,
      })),
    },
  };
}

/**
 * Wraps nodes into a single `@graph` document.
 *
 * One `<script>` containing a graph is preferable to several separate scripts:
 * the nodes can cross-reference by `@id`, and crawlers parse it as one
 * connected description of the page.
 */
export function jsonLdGraph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
