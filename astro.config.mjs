// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"

// The site lives at the root of its own domain; a preview build for GitHub
// Pages sets SITE_URL and BASE_PATH (see .github/workflows/pages.yml)
// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? "https://dimeunrestaurante.com",
  base: process.env.BASE_PATH ?? "/",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
})
