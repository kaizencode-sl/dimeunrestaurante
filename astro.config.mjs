// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import redirects from "./src/data/redirects.json" with { type: "json" }

// The site lives at the root of its own domain; a preview build for GitHub
// Pages sets SITE_URL and BASE_PATH (see .github/workflows/pages.yml)
// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? "https://dimeunrestaurante.com",
  base: process.env.BASE_PATH ?? "/",
  // The old WordPress site's addresses (scripts/redirects.mjs), sent to
  // their new pages under the base the site is built for
  redirects: Object.fromEntries(
    Object.entries(redirects).map(([from, to]) => [
      from,
      to.startsWith("/") ? (process.env.BASE_PATH ?? "").replace(/\/$/, "") + to : to,
    ])
  ),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    // Every page except the 404 and the per-restaurant seal pages, which
    // are near-identical download pages kept out of search (noindex)
    // The preview build has no sitemap: it isn't meant to be indexed
    ...(process.env.PUBLIC_PREVIEW
      ? []
      : [
          sitemap({
            filter: (page) =>
              !/\/404\/?$/.test(page) && !/\/sello\/[^/]+\/$/.test(page),
          }),
        ]),
  ],
})
