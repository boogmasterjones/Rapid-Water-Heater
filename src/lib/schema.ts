import { canonicalUrl, site, phoneHref } from './site';

type JsonLd = Record<string, unknown>;
type Faq = { question: string; answer: string };
type Crumb = { name: string; path: string };

const businessId = `${site.site.url}/#business`;

// "<" is escaped so content can never close the surrounding <script> tag.
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function businessSchema(cities: string[], serviceNames: string[]): JsonLd {
  const { business } = site;
  const { address } = business;
  return {
    '@context': 'https://schema.org',
    '@type': business.schemaType,
    '@id': businessId,
    name: business.name,
    description: business.description,
    url: `${site.site.url}/`,
    telephone: phoneHref(business.phone).replace('tel:', ''),
    email: business.email,
    image: `${site.site.url}${site.site.defaultOgImage}`,
    address: {
      '@type': 'PostalAddress',
      ...(address.street && { streetAddress: address.street }),
      addressLocality: address.city,
      addressRegion: address.region,
      ...(address.postalCode && { postalCode: address.postalCode }),
      addressCountry: 'US',
    },
    areaServed: [...cities, ...business.alsoServing].map((name) => ({ '@type': 'City', name })),
    makesOffer: serviceNames.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name },
    })),
    openingHoursSpecification: business.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    ...(business.sameAs.length > 0 && { sameAs: business.sameAs }),
    ...(business.googleMapsUrl && { hasMap: business.googleMapsUrl }),
    ...(business.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: business.rating.value,
        reviewCount: business.rating.count,
      },
    }),
  };
}

export function breadcrumbSchema(crumbs: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}

export function serviceSchema(name: string, description: string, path: string, areaName: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: canonicalUrl(path),
    provider: { '@id': businessId },
    areaServed: areaName,
  };
}

export function faqSchema(faqs: Faq[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function blogPostingSchema(post: {
  title: string;
  description: string;
  path: string;
  date: Date;
  updatedAt?: Date;
  image?: string;
  author?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: canonicalUrl(post.path),
    mainEntityOfPage: canonicalUrl(post.path),
    datePublished: post.date.toISOString(),
    dateModified: (post.updatedAt ?? post.date).toISOString(),
    image: `${site.site.url}${post.image ?? site.site.defaultOgImage}`,
    author: post.author ? { '@type': 'Person', name: post.author } : { '@id': businessId },
    publisher: { '@id': businessId },
  };
}

export function areaSchema(city: string, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': site.business.schemaType,
    name: site.business.name,
    telephone: phoneHref(site.business.phone).replace('tel:', ''),
    url: canonicalUrl(path),
    areaServed: { '@type': 'City', name: `${city}, ${site.business.address.region}` },
    parentOrganization: { '@id': businessId },
  };
}
