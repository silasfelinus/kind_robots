import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        title: z.string(),
        subtitle: z.string(),
        description: z.string(),
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
