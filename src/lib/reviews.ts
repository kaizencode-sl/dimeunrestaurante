import { getCollection, type CollectionEntry } from "astro:content"
import { url } from "@/lib/url"

export type Review = CollectionEntry<"reviews">

export const reviewUrl = (id: string) => url(`/restaurantes/${id}`)

/** "9.5" → "9,5" */
export const formatScore = (score: number | null) =>
  score === null ? "–" : String(score).replace(".", ",")

/** Reviews newest visit first, as imported */
export async function getReviews() {
  const reviews = await getCollection("reviews")
  // Local photos live under the site's base
  return reviews.map((r) => ({
    ...r,
    data: { ...r.data, images: r.data.images.map(url) },
  }))
}

/**
 * An Instagram photo's 800px copy (scripts/photos.mjs) for phones and
 * thumbnails; other photos have a single size
 */
export const srcset = (src: string) =>
  IG.test(src) ? `${smallPhoto(src)} 800w, ${src} 1600w` : undefined

const IG = /\/img\/ig\/[^/]+\.webp$/
/** The 800px copy where there is one, else the photo itself */
export const smallPhoto = (src: string) =>
  IG.test(src) ? src.replace(/\.webp$/, "-800.webp") : src

/**
 * The reviews the homepage tells its story with. Their photos are kept in
 * public/img/home so the first screen never waits on the old server.
 */
export const HOME_PICKS: { id: string; photos: string[] }[] = [
  {
    id: "nakeima",
    photos: ["nakeima-0", "nakeima-1", "nakeima-4", "nakeima-2"],
  },
  {
    id: "diverxo",
    photos: ["diverxo-5", "diverxo-1", "diverxo-2", "diverxo-3"],
  },
  {
    id: "la-tasquita-de-enfrente",
    photos: [
      "la-tasquita-de-enfrente-3",
      "la-tasquita-de-enfrente-1",
      "la-tasquita-de-enfrente-2",
      "la-tasquita-de-enfrente-0",
    ],
  },
  { id: "umiko", photos: ["umiko-0", "umiko-2", "umiko-3", "umiko-4"] },
  {
    id: "taberna-de-elia",
    photos: [
      "taberna-de-elia-1",
      "taberna-de-elia-2",
      "taberna-de-elia-4",
      "taberna-de-elia-5",
    ],
  },
  { id: "tripea", photos: ["tripea-3", "tripea-1", "tripea-4", "tripea-5"] },
]

/** Count of values across reviews, most frequent first */
export function tally(
  reviews: Review[],
  pick: (r: Review) => string | string[] | null
) {
  const counts = new Map<string, number>()
  for (const r of reviews) {
    for (const v of [pick(r)].flat())
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1])
}

/** "Para primera cita" → "Primera cita" */
export const shortPlan = (plan: string) =>
  plan.replace(/^Para (ir )?/, "").replace(/^./, (c) => c.toUpperCase())
