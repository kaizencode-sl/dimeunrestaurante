import type { APIRoute } from "astro"
import { getPins } from "@/lib/pins"

// The map's pins, for pages that load the map late (the homepage)
export const GET: APIRoute = async () => Response.json(await getPins())
