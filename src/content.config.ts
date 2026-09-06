import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const CATEGORY_ALIASES: Record<string, string> = {
  "通信协议": "Communication Protocol",
  "Embedded Linux": "Linux",
};

function normalizeCategories(items: string[]): string[] {
  return [
    ...new Set(
      items.map((category) => CATEGORY_ALIASES[category] ?? category),
    ),
  ];
}

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),
    imageFit: z.enum(["cover", "contain"]).default("cover"),
    badge: z.string().optional(),
    draft: z.boolean().default(false),
    demo: z.enum(["stack-memory", "heap-memory", "stack-and-heap", "pointer-function"]).optional(),
    categories: z
      .array(z.string())
      .transform(normalizeCategories)
      .optional(),
    tags: z
      .array(z.string())
      .refine((items: string[]) => new Set(items).size === items.length, {
        message: "tags must be unique",
      })
      .optional(),
  }),
});

export const collections = { blog };
