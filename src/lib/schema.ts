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
    ...(business.email && { email: business.email }),
    image: `${site.site.url}${site.site.defaultOgImage}`,
    logo: `${site.site.url}/images/mascot-logo.png`,
    address: {
      '@type': 'PostalAddress',
      ...(address.street && { streetAddress: address.street }),
      addressLocality: address.city,
      addressRegion: address.region,
      ...(address.postalCode && { postalCode: address.postalCode }),
      addressCountry: 'US',
    },
    // "Venice" alone is ambiguous (Italy, California), so every city carries the state.
    areaServed: [...new Set([address.city, ...cities, ...business.alsoServing])].map((name) => ({ '@type': 'City', name: `${name}, ${address.region}` })),
    makesOffer: serviceNames.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name },
    })),
    ...(business.hours.length > 0 && {
      openingHoursSpecification: business.hours.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.days,
        opens: h.opens,
        closes: h.closes,
      })),
    }),
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

// A service, provided by the business node (businessSchema is emitted on the same page so the @id resolves).
export function serviceSchema(name: string, description: string, path: string, areas: string[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: name,
    description,
    url: canonicalUrl(path),
    provider: { '@id': businessId },
    areaServed: areas.map((a) => ({ '@type': 'City', name: `${a}, ${site.business.address.region}` })),
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

// A location page: the business's services in one city. Replaces a second, address-less Plumber node that Google's
// LocalBusiness rules flag (a LocalBusiness needs an address); the one real business node is referenced by @id.
export function areaSchema(city: string, name: string, description: string, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: 'Water heater installation and plumbing',
    description,
    url: canonicalUrl(path),
    provider: { '@id': businessId },
    areaServed: { '@type': 'City', name: `${city}, ${site.business.address.region}` },
  };
}
