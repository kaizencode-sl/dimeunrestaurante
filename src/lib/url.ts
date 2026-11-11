/**
 * Paths inside the site, under the base it is deployed at: "/" on its own
 * domain, "/dimeunrestaurante/" on GitHub Pages (see astro.config.mjs).
 * External URLs pass through untouched.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")

export const url = (path: string) =>
  path.startsWith("/") && !path.startsWith("//") ? BASE + path : path
