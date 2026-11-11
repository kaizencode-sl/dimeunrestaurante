import type { APIRoute } from "astro"
import { touchIcon } from "@/lib/og"

export const GET: APIRoute = () =>
  new Response(new Uint8Array(touchIcon()), {
    headers: { "Content-Type": "image/png" },
  })
