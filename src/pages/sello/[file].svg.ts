import type { APIRoute, GetStaticPaths } from "astro"
import { getReviews, reviewUrl } from "@/lib/reviews"
import { SEAL_MIN, sealSvg, signSvg, type SealTheme } from "@/lib/seal"

// /sello/<id>.svg (night) and /sello/<id>-claro.svg (light) for every
// restaurant with a seal, plus the printable sign with a QR to the review:
// /sello/<id>-cartel.svg and /sello/<id>-cartel-claro.svg
export const getStaticPaths = (async () => {
  const reviews = await getReviews()
  return reviews
    .filter((r) => (r.data.score ?? 0) >= SEAL_MIN)
    .flatMap((r) =>
      (["noche", "claro"] as SealTheme[]).flatMap((theme) => {
        const tail = theme === "claro" ? "-claro" : ""
        const props = {
          id: r.id,
          name: r.data.name,
          score: r.data.score!,
          year: r.data.year,
          theme,
        }
        return [
          {
            params: { file: `${r.id}${tail}` },
            props: { ...props, sign: false },
          },
          {
            params: { file: `${r.id}-cartel${tail}` },
            props: { ...props, sign: true },
          },
        ]
      })
    )
}) satisfies GetStaticPaths

type Props = {
  id: string
  name: string
  score: number
  year?: number | null
  theme: SealTheme
  sign: boolean
}

export const GET: APIRoute<Props> = ({ props, site }) => {
  const { id, sign, ...seal } = props
  const url = new URL(reviewUrl(id), site ?? "https://dimeunrestaurante.com")
  return new Response(
    sign ? signSvg({ ...seal, url: url.href }) : sealSvg(seal),
    {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    }
  )
}
