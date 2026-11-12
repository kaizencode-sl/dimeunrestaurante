// An 800px copy of every Instagram photo (<name>-800.webp, beside it) for
// srcset, so phones and thumbnails don't load the 1600px originals. Run it
// after import-reviews; it only makes the copies that are missing.
//
//   node scripts/photos.mjs
import fs from "node:fs/promises"
import sharp from "sharp"

const IG_DIR = "public/img/ig"

const exists = (path) =>
  fs.access(path).then(
    () => true,
    () => false
  )

const originals = (await fs.readdir(IG_DIR)).filter(
  (f) => f.endsWith(".webp") && !f.endsWith("-800.webp")
)
let made = 0
for (const f of originals) {
  const out = `${IG_DIR}/${f.replace(/\.webp$/, "-800.webp")}`
  if (await exists(out)) continue
  await sharp(`${IG_DIR}/${f}`)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(out)
  made++
}
console.log(`${made} new 800px copies`)
