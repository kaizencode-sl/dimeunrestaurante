import type { APIRoute } from "astro"

// The real site invites crawlers and points them at the sitemap; a preview
// build (GitHub Pages, PUBLIC_PREVIEW) asks them to stay away so it
// never competes with it
const PRODUCTION = "https://dimeunrestaurante.com"

export const GET: APIRoute = ({ site }) => {
  const origin = (site?.href ?? PRODUCTION).replace(/\/$/, "")
  const base = import.meta.env.BASE_URL.replace(/\/$/, "")
  const body =
    origin === PRODUCTION && !import.meta.env.PUBLIC_PREVIEW
      ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}/sitemap-index.xml\n`
      : "User-agent: *\nDisallow: /\n"
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
