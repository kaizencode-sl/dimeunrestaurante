import { defineCollection } from "astro:content"
import { file } from "astro/loaders"
import { z } from "astro/zod"

// Every review from dimeunrestaurante.com, imported by scripts/import-reviews.mjs
const reviews = defineCollection({
  loader: file("src/data/reviews.json"),
  schema: z.object({
    name: z.string(),
    city: z.string(),
    headline: z.string(),
    score: z.number().nullable(),
    price: z.string().nullable(),
    plans: z.array(z.string()),
    venue: z.array(z.string()),
    cuisine: z.array(z.string()),
    paid: z.string().nullable(),
    avgPrice: z.string().nullable(),
    visit: z.string(),
    year: z.number().nullable(),
    month: z.number().nullable(),
    address: z.array(z.string()),
    images: z.array(z.string()),
    excerpt: z.string(),
    body: z.array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("p"), text: z.string() }),
        z.object({ type: z.literal("list"), items: z.array(z.string()) }),
        z.object({ type: z.literal("h"), text: z.string() }),
      ])
    ),
    words: z.number(),
    /** Written or updated from Alberto's Instagram posts */
    instagram: z
      .object({
        kind: z.enum(["new", "update"]),
        date: z.string().nullable(),
        /** The restaurant's own Instagram account, without the @ */
        handle: z.string().nullable().optional(),
        posts: z.array(
          z.object({
            id: z.string(),
            url: z.string(),
            date: z.string().nullable(),
            /** The review itself, the photos of each dish, or the wines */
            kind: z.enum(["opinion", "dishes", "drinks"]).nullable().optional(),
          })
        ),
      })
      .nullable(),
  }),
})

export const collections = { reviews }
