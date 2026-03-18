import { defineCollection, z } from "astro:content"
import { file, glob } from "astro/loaders"

// ─── Availability ──────────────────────────────────────────────────────────
// Edit src/content/availability/index.yaml to change availability status.
const availability = defineCollection({
  loader: file("src/content/availability/index.yaml"),
  schema: z.object({
    available: z.boolean(),
    messageNl: z.string().optional(),
    messageEn: z.string().optional(),
    messageDe: z.string().optional(),
  }),
})

// ─── Services ─────────────────────────────────────────────────────────────
// Markdown files at src/content/services/{locale}/{service-id}.md
const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/services" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Short one-liner for cards */
    tagline: z.string(),
    /** Lucide icon name (snake_case) */
    icon: z.string(),
    /** Show on home page as featured service */
    featured: z.boolean().default(false),
    /** Controls sort order in service lists */
    order: z.number().default(99),
    /** Canonical service ID shared across locales (e.g. "administrative-support") */
    serviceId: z.string(),
    /** Starting price hint */
    price: z.string().optional(),
  }),
})

export const collections = { availability, services }
