import type { APIRoute, GetStaticPaths } from "astro"
import { getReviews, HOME_PICKS } from "@/lib/reviews"
import { reviewCard, siteCard } from "@/lib/og"

// /og/dime.png for the site, and /og/<id>.png for every review with no
// photo to share (the others share their cover photo)
export const getStaticPaths = (async () => {
  const reviews = await getReviews()
  const noPhoto = reviews.filter(
    (r) => !r.data.images.length && !HOME_PICKS.some((p) => p.id === r.id)
  )
  return [
    { params: { name: "dime" }, props: { site: reviews.length } },
    ...noPhoto.map((r) => ({
      params: { name: r.id },
      props: {
        review: { name: r.data.name, city: r.data.city, score: r.data.score },
      },
    })),
  ]
}) satisfies GetStaticPaths

type Props =
  | { site: number; review?: undefined }
  | {
      site?: undefined
      review: { name: string; city: string; score: number | null }
    }

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(
    new Uint8Array(
      props.review ? reviewCard(props.review) : siteCard(props.site!)
    ),
    { headers: { "Content-Type": "image/png" } }
  )
