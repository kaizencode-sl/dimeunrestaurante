// Redirects from the old WordPress site's addresses to the new pages, so
// links and search results that point at the old site keep working when the
// domain moves. Writes src/data/redirects.json, read by astro.config.mjs.
// Usage: node scripts/redirects.mjs ../dime-automation/data/reviews.jsonl
//
// Reviews kept the same address (/restaurantes/<slug>), so only these need
// a redirect:
// - reviews left out of the new site (30 words or fewer): to their city
// - category pages (/category/<slug>/): a city goes to the list filtered by
//   it, any other category to the whole list
// - the old pages and news posts (from the old sitemap)
import { readFileSync, writeFileSync } from "node:fs"

const source = process.argv[2]
if (!source) {
  console.error("Usage: node scripts/redirects.mjs <reviews.jsonl>")
  process.exit(1)
}

const raw = readFileSync(source, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))
const reviews = JSON.parse(readFileSync("src/data/reviews.json", "utf8"))
const ids = new Set(reviews.map((r) => r.id))

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const LIST = "/restaurantes/"
// Left unencoded: Astro encodes the destination when it writes the redirect
const byCity = (city) => (city ? `${LIST}?ciudad=${city}` : LIST)

// The same restaurant under another slug on the new site
const SAME = { "sushi-samba": "/restaurantes/sushi-shamba/" }

const redirects = {}

for (const r of raw) {
  if (ids.has(r.slug)) continue
  redirects[`/restaurantes/${r.slug}`] = SAME[r.slug] ?? byCity(r.city)
}

// City categories, by the cities the new site has
const cities = new Map(reviews.map((r) => [slug(r.city), r.city]))
const categories = new Set(
  raw.flatMap((r) =>
    [...(r.classes ?? "").matchAll(/category-([\w-]+)/g)].map((m) => m[1])
  )
)
for (const c of [...categories].sort())
  redirects[`/category/${c}`] = cities.has(c) ? byCity(cities.get(c)) : LIST

// Pages and posts from the old sitemap
const HOME = "/"
const PAGES = {
  "/listado-restaurantes": LIST,
  "/clasificacion-2015": LIST,
  "/mas-leidos": LIST,
  "/marcadores": LIST,
  "/proximas-visitas": LIST,
  "/instagram": "https://www.instagram.com/alberto_deluna/",
  "/quien-soy": HOME,
  "/quien-soy/contacto-con-alberto-de-luna": HOME,
  "/contacto": HOME,
  "/como-puntuo": HOME,
  "/el-digestivo": HOME,
  "/podcast-de-alberto-luna-en-10radio": HOME,
  "/publicidad-nova-internet": HOME,
  "/noticias": HOME,
}
Object.assign(redirects, PAGES)
const POSTS = [
  "noticias/lo-mejor-del-2014",
  "noticias/lista-de-las-5-peores-experiencias-de-mi-vida",
  "noticias/hello-world",
  "noticias/fotos-de-la-fiesta-de-lanzamiento-de-la-web",
  "noticias/mi-lista-de-tortillas-de-patata",
  "noticias/mi-lista-de-croquetas",
  "noticias/ya-ha-salido-la-lista-del-51-100-best-restaurants-os-paso-el-link",
  "uncategorized/la-lista-1-50-en-the-worlds-50-best-restaurants",
]
for (const p of POSTS) redirects[`/${p}`] = HOME
// Any other news post: these come from the old noticias sitemap
const extra = process.argv[3]
if (extra)
  for (const loc of readFileSync(extra, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(loc[1]).pathname.replace(/\/$/, "")
    if (path.startsWith("/noticias/") || path.startsWith("/uncategorized/"))
      redirects[path] ??= HOME
  }

writeFileSync(
  "src/data/redirects.json",
  JSON.stringify(redirects, null, 2) + "\n"
)
console.log(`${Object.keys(redirects).length} redirects`)
