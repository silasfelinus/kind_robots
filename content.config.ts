// /content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import * as z from 'zod'

export const pageLayoutSchema = z.enum(['default', 'workspace'])

const contentSchema = z.object({
  title: z.string().optional(),
  room: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  tooltip: z.string().optional(),
  dottitip: z.string().optional(),
  amitip: z.string().optional(),
  artPrompt: z.string().optional(),
  sort: z.string().optional(),

  layout: pageLayoutSchema.default('default'),
  dashboardKey: z.string().optional(),
  dashboardTab: z.string().optional(),
  cards: z.string().optional(),
  loadingMessage: z.string().optional(),
  refreshLabel: z.string().optional(),
  footer: z.string().optional(),
  footerState: z.string().optional(),

  path: z.string(),

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

export type PageLayoutName = z.infer<typeof pageLayoutSchema>

export type PageBrief = {
  title: string
  room: string
  subtitle: string
  description: string
  icon: string
  image: string
  tooltip: string
  dottitip: string
  amitip: string
  artPrompt: string
  layout: PageLayoutName
  dashboardKey?: string
  dashboardTab?: string
  cards?: string
  loadingMessage?: string
  refreshLabel?: string
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
