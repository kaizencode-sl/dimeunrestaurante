// Turns the scraped reviews (JSON Lines from dime-automation) into the
// content collection at src/data/reviews.json.
// Usage: node scripts/import-reviews.mjs ../dime-automation/data/reviews.jsonl [../dime-automation/output]
// The optional second argument is the automation's output folder: the reviews
// it drafted from Instagram (generated.json) are added as new reviews, and its
// update_*.json files append an update to an existing one.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const source = process.argv[2]
if (!source) {
  console.error("Usage: node scripts/import-reviews.mjs <reviews.jsonl>")
  process.exit(1)
}

const PRICES = ["Menos de 50€", "Más de 50€", "Más de 100€"]
const VENUES = [
  "Chulo",
  "De moda",
  "De barra",
  "Con terraza",
  "Cool",
  "Clásico",
  "Abierto los domingos",
  "Con cocina siempre abierta",
  "Excelente RCP",
]
// Cuisine tags that don't start with "De …"; city tags are left out
const CUISINES = [
  "Japonés", "Fusión", "Asiático", "Italiano", "Mexicano", "Peruano", "Asador",
  "Chino", "Tailandés", "Indio", "Arrocería", "Francés", "Griego", "Libanés",
  "Coreano", "Vietnamita", "Argentino", "Americano", "Nikkei",
]

const raw = readFileSync(source, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))

// Drafts from Instagram, in the same shape as the scraped reviews
const instagramDir = process.argv[3]
if (instagramDir) {
  const samplePath = join(instagramDir, "../data/instagram_sample.json")
  const posts = new Map(
    (existsSync(samplePath) ? JSON.parse(readFileSync(samplePath, "utf8")) : []).map((p) => [p.id, p])
  )
  const meta = (ids, kind) => {
    const list = ids.map((id) => ({
      id,
      url: posts.get(id)?.url ?? `https://www.instagram.com/p/${id}/`,
      date: posts.get(id)?.date ?? null,
    }))
    const date = list.map((p) => p.date).filter(Boolean).sort().at(-1) ?? null
    return { kind, date, posts: list }
  }
  const words = (t) => t.split(/\s+/).filter(Boolean).length

  const generated = JSON.parse(readFileSync(join(instagramDir, "generated.json"), "utf8"))
  for (const g of generated) {
    if (raw.some((r) => r.slug === g.slug)) continue
    raw.push({ ...g, images: [], word_count: words(g.body), instagram: meta(g.source_posts, "new") })
  }
  for (const file of readdirSync(instagramDir).filter((f) => /^update_.*\.json$/.test(f))) {
    const u = JSON.parse(readFileSync(join(instagramDir, file), "utf8"))
    const target = raw.find((r) => r.slug === u.slug)
    if (!target) continue
    // The first line of the update is its title
    const [title, ...rest] = u.update_block.split("\n")
    target.body = `${target.body}\n## ${title}\n${rest.join("\n")}`
    target.word_count += words(u.update_block)
    target.instagram = meta(u.source_posts, "update")
  }
}

const cities = new Set(raw.map((r) => r.city).filter(Boolean))

// Headlines are stored in capitals. Words he writes capitalised mid-sentence
// in his reviews (places, chefs, brands) keep their capital when lowered.
const SMALL = new Set(["a", "al", "and", "by", "con", "de", "del", "el", "en", "la", "las", "lo", "los", "of", "por", "the", "y", "gran", "ten", "lunas", "mediterráneo"])
const properNouns = (() => {
  const seen = new Map()
  for (const r of raw) {
    for (const m of (r.body ?? "").matchAll(/(?<=[\p{L},;] )(\p{L}+)/gu)) {
      const w = m[1]
      const key = w.toLowerCase()
      const entry = seen.get(key) ?? { upper: 0, total: 0, form: w }
      entry.total++
      if (/^\p{Lu}\p{Ll}/u.test(w)) {
        entry.upper++
        entry.form = w
      }
      seen.set(key, entry)
    }
  }
  for (const c of cities) for (const w of c.split(/\s+/)) seen.set(w.toLowerCase(), { upper: 9, total: 9, form: w })
  return new Map(
    [...seen].filter(([k, e]) => !SMALL.has(k) && e.upper >= 2 && e.upper / e.total > 0.7).map(([k, e]) => [k, e.form])
  )
})()

const sentenceCase = (s, name) => {
  const own = new Set(name.toLowerCase().split(/\s+/).filter((w) => !SMALL.has(w)))
  return s
    .toLowerCase()
    .replace(/\p{L}+/gu, (w, i) =>
      i === 0 || own.has(w) || properNouns.has(w)
        ? (properNouns.get(w) ?? w.charAt(0).toUpperCase() + w.slice(1))
        : w
    )
}

const titleCase = (s) =>
  s
    .toLowerCase()
    .replace(/(^|[\s(“"'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
    .replace(/(?<=\s)(\p{L}+)/gu, (w) => (SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w))

const parseScore = (s) => {
  const n = parseFloat(String(s ?? "").split(/\s/)[0].replace(",", "."))
  return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]
const parseVisit = (s) => {
  const text = (s ?? "").trim()
  const year = Number(text.match(/\d{4}/)?.[0]) || null
  const m = MONTHS.findIndex((name) => text.toLowerCase().includes(name))
  return { visit: text, year, month: m >= 0 ? m + 1 : null }
}

// Widget text the old theme injected into some reviews
const BOILERPLATE = /^(Apoya a tus restaurantes favoritos|Más información y reservas con WhatsApp$)/i

const body = (text) => {
  const blocks = []
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (BOILERPLATE.test(line)) continue
    const heading = line.match(/^## (.+)/)
    if (heading) {
      blocks.push({ type: "h", text: heading[1].charAt(0) + heading[1].slice(1).toLowerCase() })
      continue
    }
    const item = line.match(/^[–—-]\s*(.+)/)
    if (item) {
      const last = blocks.at(-1)
      if (last?.type === "list") last.items.push(item[1])
      else blocks.push({ type: "list", items: [item[1]] })
    } else blocks.push({ type: "p", text: line })
  }
  return blocks
}

const reviews = raw
  .filter((r) => r.name && r.word_count > 30)
  .map((r) => {
    const cats = [...new Set(r.categories)]
    const blocks = body(r.body)
    const excerpt =
      blocks.find(
        (b) => b.type === "p" && b.text.length > 60 && !/^(aviso|atención|pendiente)/i.test(b.text)
      )?.text ?? ""
    const address = (r.address ?? "")
      .replace(/^Dirección:\s*/i, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    return {
      id: r.slug,
      // Short names in capitals are acronyms (OME), not shouting
      name: /^\p{Lu}{2,3}$/u.test(r.name.trim())
        ? r.name.trim()
        : titleCase(r.name.replace(/\s+/g, " ").trim()),
      city: r.city ?? "",
      headline: r.headline ? sentenceCase(r.headline.trim(), r.name) : "",
      score: parseScore(r.score),
      price: cats.find((c) => PRICES.includes(c)) ?? null,
      plans: cats.filter((c) => c.startsWith("Para ")),
      venue: cats.filter((c) => VENUES.includes(c)),
      cuisine: cats.filter(
        (c) => !VENUES.includes(c) && (c.startsWith("De ") || CUISINES.includes(c))
      ),
      paid: r.paid?.trim() || null,
      avgPrice: r.avg_price?.trim() || null,
      ...parseVisit(r.visit_date),
      address,
      images: [...new Set(r.images)],
      excerpt: excerpt.length > 220 ? excerpt.slice(0, 217).replace(/\s\S*$/, "") + "…" : excerpt,
      body: blocks,
      words: r.word_count,
      instagram: r.instagram ?? null,
    }
  })
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0))

writeFileSync("src/data/reviews.json", JSON.stringify(reviews, null, 1))
console.log(`${reviews.length} reviews, ${cities.size} cities`)
