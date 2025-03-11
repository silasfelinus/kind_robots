import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        title: z.string(),
        path: z.string(),
        description: z.string(),
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
        subtitle: z.string(),
        layout: z.string(),
        icon: z.string(),
        image: z.string(),
        gallery: z.string(),
        tags: z.array(z.string()),
        category: z.string(),
        tooltip: z.string(),
        dottitip: z.string(),
        amitip: z.string(),
        sort: z.string(),
      }),
    }),
  },
})
