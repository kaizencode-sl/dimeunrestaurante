// Geocodes every review's address once, with OpenStreetMap's Nominatim, into
// src/data/geo.json. Re-runs only look up reviews missing from that file.
//
//   node scripts/geocode.mjs
//
// Nominatim allows one request a second, so the first run takes ~15 minutes.
// Each review tries, in order: its address, its name, and finally its city
// (marked approx, so the map can say the pin is only roughly placed). Any hit
// further than MAX_KM from the city is ignored as a wrong match.
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const REVIEWS = new URL("../src/data/reviews.json", import.meta.url)
const OUT = new URL("../src/data/geo.json", import.meta.url)
const MAX_KM = 80
const UA = "dimeunrestaurante-demo-map/1.0"

const reviews = JSON.parse(readFileSync(REVIEWS, "utf8"))
const geo = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {}
const cities = {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let last = 0
async function search(q) {
  const wait = last + 1100 - Date.now()
  if (wait > 0) await sleep(wait)
  last = Date.now()
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=es&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { "User-Agent": UA } })
  if (!res.ok) throw new Error(`${res.status} for ${q}`)
  const [hit] = await res.json()
  return hit ? { lat: +(+hit.lat).toFixed(5), lon: +(+hit.lon).toFixed(5) } : null
}

function km(a, b) {
  const rad = Math.PI / 180
  const x = (b.lon - a.lon) * rad * Math.cos(((a.lat + b.lat) / 2) * rad)
  const y = (b.lat - a.lat) * rad
  return Math.hypot(x, y) * 6371
}

// Drop phone numbers, opening notes and stray punctuation from an address
function clean(address) {
  return address
    .split(/\.?\s*(?:Tl?f|Telf?|Tel[eé]fono|Tfno|Reservas)[.:]?\s*/i)[0]
    .replace(/\(.*?\)/g, "")
    .replace(/\s*\.\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function cityPoint(city) {
  if (!(city in cities)) cities[city] = await search(city)
  return cities[city]
}

let done = 0
const todo = reviews.filter((r) => !geo[r.id])
console.log(`${todo.length} to geocode, ${reviews.length - todo.length} cached`)

for (const r of todo) {
  try {
    const center = await cityPoint(r.city)
    const near = (p) => p && (!center || km(center, p) <= MAX_KM)
    let point = null
    for (const a of r.address.map(clean).filter((a) => a.length > 3)) {
      const q = a.toLowerCase().includes(r.city.toLowerCase()) ? a : `${a}, ${r.city}`
      point = await search(q)
      if (near(point)) break
      point = null
    }
    if (!point) {
      point = await search(`${r.name}, ${r.city}`)
      if (!near(point)) point = null
    }
    if (point) geo[r.id] = point
    else if (center) geo[r.id] = { ...center, approx: true }
  } catch (e) {
    console.warn(r.id, e.message)
    await sleep(5000)
  }
  if (++done % 20 === 0) {
    writeFileSync(OUT, JSON.stringify(geo, null, 1))
    console.log(`${done}/${todo.length}`)
  }
}
writeFileSync(OUT, JSON.stringify(geo, null, 1))
const all = Object.values(geo)
console.log(`done: ${all.length} placed, ${all.filter((g) => g.approx).length} approximate`)
