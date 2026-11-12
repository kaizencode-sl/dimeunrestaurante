import { getReviews, HOME_PICKS, smallPhoto } from "@/lib/reviews"
import geo from "@/data/geo.json"
import { url } from "@/lib/url"

/** A restaurant on the moon map */
export type Pin = {
  id: string
  name: string
  city: string
  score: number
  headline: string
  photo: string | null
  lon: number
  lat: number
}

type Point = { lat: number; lon: number; approx?: boolean }
const points = geo as Record<string, Point>

/**
 * Every scored review with a real location. Pins placed only by their city
 * would pile up in its centre, so those are left out.
 */
export async function getPins(): Promise<Pin[]> {
  const reviews = await getReviews()
  return reviews.flatMap(({ id, data: r }) => {
    const g = points[id]
    if (!g || g.approx || r.score === null) return []
    const local = HOME_PICKS.find((p) => p.id === id)
    return [
      {
        id,
        name: r.name,
        city: r.city,
        score: r.score,
        headline: r.headline,
        photo: local
          ? url(`/img/home/${local.photos[0]}.jpg`)
          : r.images[0]
            ? smallPhoto(r.images[0])
            : null,
        lon: g.lon,
        lat: g.lat,
      },
    ]
  })
}
