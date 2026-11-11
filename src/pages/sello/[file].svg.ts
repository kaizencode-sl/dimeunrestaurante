import type { APIRoute, GetStaticPaths } from "astro"
import { getReviews } from "@/lib/reviews"
import { SEAL_MIN, sealSvg, type SealTheme } from "@/lib/seal"

// /sello/<id>.svg (night) and /sello/<id>-claro.svg (light) for every
// restaurant with a seal
export const getStaticPaths = (async () => {
  const reviews = await getReviews()
  return reviews
    .filter((r) => (r.data.score ?? 0) >= SEAL_MIN)
    .flatMap((r) =>
      (["noche", "claro"] as SealTheme[]).map((theme) => ({
        params: { file: theme === "claro" ? `${r.id}-claro` : r.id },
        props: {
          name: r.data.name,
          score: r.data.score!,
          year: r.data.year,
          theme,
        },
      }))
    )
}) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) =>
  new Response(sealSvg(props as Parameters<typeof sealSvg>[0]), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  })
