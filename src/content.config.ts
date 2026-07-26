import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projets = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projets" }),
  schema: z.object({
    title: z.string(),
    pillar: z.enum(["conseil-marque", "web-mobile", "contenu-audiovisuel", "social-growth"]),
    type: z.string(),
    client: z.string(),
    sector: z.string().optional(),
    year: z.number(),
    role: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    videoId: z.string().optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    pillar: z.enum(["conseil-marque", "web-mobile", "contenu-audiovisuel", "social-growth"]),
    accroche: z.string(),
    livrables: z.array(z.string()),
    formats: z.array(z.string()),
  }),
});

export const collections = { projets, services };
