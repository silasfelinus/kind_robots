import { defineContentConfig, defineCollection } from '@nuxt/content'
import * as z from 'zod'

const contentSchema = z.object({
  title: z.string().optional(),
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
  navComponent: z.string().optional(),
  model: z.string().optional(),
  theme: z.string().optional(),
  room: z.string().optional(),
  path: z.string(),
  description: z.string().optional(),
  underConstruction: z.boolean().optional(),
showFooter: z.boolean().optional(),
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
})

export type ContentType = z.infer<typeof contentSchema> & {
  seo?: {
    title?: string
    description?: string
    meta?: Record<string, any>[]
    link?: Record<string, any>[]
    [key: string]: any
  }
}

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: contentSchema,
    }),
  },
})
