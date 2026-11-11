import type { Review } from "@/lib/reviews"
import { url } from "@/lib/url"

/**
 * Schema.org data for search engines: who Alberto is, what the site is, and
 * each review as a critic's review of a restaurant, with its score in lunas
 * out of 10.
 */

export const INSTAGRAM = "https://www.instagram.com/alberto_deluna/"

const ORIGIN = import.meta.env.SITE ?? "https://dimeunrestaurante.com"
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")

/**
 * Absolute URL for a path on the site or a full URL. Paths get the base
 * unless they already carry it, so both "/img/x.jpg" and url("/img/x.jpg")
 * end up the same.
 */
export const absolute = (path: string) => {
  if (/^https?:\/\//.test(path)) return path
  const withBase =
    BASE && (path === BASE || path.startsWith(`${BASE}/`)) ? path : url(path)
  return new URL(withBase, ORIGIN).href
}
const abs = absolute
const SITE = abs("/").replace(/\/$/, "")

export const alberto = {
  "@type": "Person",
  "@id": `${SITE}/#alberto`,
  name: "Alberto de Luna",
  url: `${SITE}/`,
  sameAs: [INSTAGRAM],
}

export const website = {
  "@type": "WebSite",
  "@id": `${SITE}/#web`,
  name: "Dime un restaurante",
  alternateName: ["Dime un Restaurante", "dimeunrestaurante"],
  url: `${SITE}/`,
  inLanguage: "es",
  publisher: { "@id": alberto["@id"] },
  // The restaurant list reads ?q= as its search
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE}/restaurantes/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

export const homeGraph = () => ({
  "@context": "https://schema.org",
  "@graph": [website, alberto],
})

/** Paths without the base, e.g. "/restaurantes/" */
export const breadcrumbs = (items: [name: string, path: string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: abs(path),
  })),
})

/** When Alberto published it: the Instagram post date, else the visit month */
export const reviewDate = (r: Review["data"]) =>
  r.instagram?.date ??
  (r.year
    ? `${r.year}${r.month ? `-${String(r.month).padStart(2, "0")}` : ""}`
    : undefined)

/**
 * The old site's address lines often carry the phone and website glued on:
 * "Calle X 1. MadridTlf: 912345678Web: http://x.com/". Split them apart.
 */
export function parseAddress(line: string | undefined) {
  if (!line) return {}
  const phone = line.match(/(?:tl?f|tel[ée]?f?)\.?:?\s*([+\d][\d\s]{7,})/i)?.[1]
  const web = line.match(/(https?:\/\/\S+|www\.\S+)/i)?.[1]
  const street = line
    .split(/(?:tl?f|tel[ée]?f?)\.?:?\s*[+\d]|web:|https?:\/\/|www\./i)[0]
    .replace(/[\s.,;:-]+$/, "")
    .trim()
  return {
    ...(street && { street }),
    ...(phone && { phone: phone.replace(/\s+/g, "") }),
    ...(web && { web: web.startsWith("http") ? web : `https://${web}` }),
  }
}

export function reviewGraph(
  review: Review,
  { image, geo }: { image?: string; geo?: { lat: number; lon: number } | null }
) {
  const r = review.data
  const place = parseAddress(r.address[0])
  // paths here go without the base: abs() adds it
  const path = `/restaurantes/${review.id}/`
  const pageUrl = abs(path)
  const restaurant = {
    "@type": "Restaurant",
    name: r.name,
    address: {
      "@type": "PostalAddress",
      ...(place.street && { streetAddress: place.street }),
      addressLocality: r.city,
    },
    ...(place.phone && { telephone: place.phone }),
    ...(place.web && { url: place.web }),
    ...(r.instagram?.handle && {
      sameAs: [`https://www.instagram.com/${r.instagram.handle}/`],
    }),
    ...(r.cuisine.length && { servesCuisine: r.cuisine }),
    ...(r.price && { priceRange: r.price }),
    ...(geo && {
      geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lon },
    }),
    ...(image && { image: abs(image) }),
  }
  return [
    {
      "@context": "https://schema.org",
      "@type": "Review",
      "@id": `${pageUrl}#review`,
      url: pageUrl,
      name: r.headline || r.name,
      ...(r.excerpt && { reviewBody: r.excerpt }),
      inLanguage: "es",
      ...(reviewDate(r) && { datePublished: reviewDate(r) }),
      author: {
        "@type": "Person",
        name: alberto.name,
        url: alberto.url,
        sameAs: alberto.sameAs,
      },
      publisher: {
        "@type": "Organization",
        name: website.name,
        url: website.url,
      },
      ...(r.score !== null && {
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.score,
          bestRating: 10,
          worstRating: 0,
        },
      }),
      itemReviewed: restaurant,
    },
    breadcrumbs([
      ["Inicio", "/"],
      ["Restaurantes", "/restaurantes/"],
      [r.name, path],
    ]),
  ]
}
