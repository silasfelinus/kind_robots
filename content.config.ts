import { defineContentConfig, defineCollection } from '@nuxt/content'
import * as z from 'zod'

const contentSchema = z.object({
  title: z.string().optional(),
  path: z.string(),
  description: z.string().optional(),
  seo: z
    .intersection(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        meta: z.array(z.record(z.string(), z.any())).optional(),
        link: z.array(z.record(z.string(), z.any())).optional(),
      }),
      z.record(z.string(), z.any()),
    )
    .optional()
    .default({}),
  body: z.object({
    type: z.string(),
    children: z.any(),
    toc: z.any(),
  }),
  navigation: z
    .union([
      z.boolean(),
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
      }),
    ])
    .default(true),
  subtitle: z.string().optional(),
  layout: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  gallery: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  tooltip: z.string().optional(),
  dottitip: z.string().optional(),
  amitip: z.string().optional(),
  sort: z.string().optional(),
})

export type ContentType = z.infer<typeof contentSchema>

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: contentSchema,
    }),
  },
})
