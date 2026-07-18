// /content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import * as z from 'zod'

const narratorSchema = z.union([
  z.string(),
  z.object({
    type: z.enum(['bot', 'character']).optional(),
    slug: z.string(),
  }),
])

const navigationRoleSchema = z.enum([
  'SYSTEM',
  'USER',
  'ASSISTANT',
  'ADMIN',
  'GUEST',
  'BOT',
  'DESIGNER',
  'CHILD',
  'FAMILY',
])

const navigationPermissionSchema = z.enum([
  'authenticated',
  'member',
  'family',
  'mature',
  'admin',
])

const navigationCardSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  route: z.string().optional(),
  action: z.string().optional(),
})

const tutorialSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().optional(),
  overview: z.string().optional(),
  tagline: z.string().optional(),
  hero: z.string().optional(),
  earnings: z.string().optional(),
  body: z.string().optional(),
  image: z.string().optional(),
  underConstruction: z.boolean().optional(),
})

const contentNavigationSchema = z.union([
  z.boolean(),
  z.object({
    title: z.string(),
    icon: z.string(),
    description: z.string(),
  }),
])

const sharedNavigationSchema = z.object({
  title: z.string().optional(),
  label: z.string().optional(),
  room: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  tooltip: z.string().optional(),
  dottiTip: z.string().optional(),
  amiTip: z.string().optional(),
  // Simple author-facing narrator selector. The page loader normalizes this
  // into the richer `narrator` reference used by the narrator system.
  narratorSlug: z.string().optional(),
  // NOTE: SQLite column names are case-insensitive, so a lowercase `dottitip`/
  // `amitip` field here collides with `dottiTip`/`amiTip` above and makes the
  // collection's CREATE TABLE fail ("duplicate column name"), which leaves the
  // content tables uncreated and 500s every page. Keep a single canonical
  // camelCase key; legacy lowercase frontmatter is normalized in content files.
  summary: z.string().optional(),
  narrative: z.string().optional(),
  sort: z.union([z.string(), z.number()]).optional(),
  channelKey: z.string().optional(),
  tabKey: z.string().optional(),
  dashboardKey: z.string().optional(),
  dashboardTab: z.string().optional(),
  defaultTab: z.string().optional(),
  route: z.string().optional(),
  component: z.string().optional(),
  modelType: z.string().optional(),
  cards: z.union([z.string(), z.array(navigationCardSchema)]).optional(),
  tutorial: tutorialSchema.optional(),
  requiredBeforeNext: z.array(z.string()).optional(),
  requiredRole: navigationRoleSchema.optional(),
  requiredPermission: navigationPermissionSchema.optional(),
  visible: z.boolean().default(true),
  status: z.string().optional(),
  loadingMessage: z.string().optional(),
  refreshLabel: z.string().optional(),
})

const pageSchema = sharedNavigationSchema.extend({
  contentType: z.enum(['page', 'channel', 'tab']).default('page'),
  narrator: narratorSchema.optional(),
  artPrompt: z.string().optional(),
  footer: z.string().optional(),
  footerState: z.string().optional(),
  navigation: contentNavigationSchema.default(false),
})

const channelSchema = sharedNavigationSchema.extend({
  contentType: z.enum(['channel', 'tab']),
  channelKey: z.string(),
  navigation: contentNavigationSchema.default(false),
})

export type ContentType = z.infer<typeof pageSchema>
export type ChannelContentType = z.infer<typeof channelSchema>

export type PageNarratorRef =
  | string
  | {
      type?: 'bot' | 'character'
      slug: string
    }

export type PageBrief = {
  title: string
  room: string
  subtitle: string
  description: string
  icon: string
  image: string
  tooltip: string
  dottiTip: string
  amiTip: string
  narratorSlug?: string
  narrator?: PageNarratorRef
  artPrompt: string
  channelKey?: string
  tabKey?: string
  dashboardKey?: string
  summary?: string
  dashboardTab?: string
  cards?: string | z.infer<typeof navigationCardSchema>[]
  tutorial?: z.infer<typeof tutorialSchema>
  loadingMessage?: string
  refreshLabel?: string
}

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        exclude: ['channels/**'],
      },
      schema: pageSchema,
    }),
    channels: defineCollection({
      type: 'page',
      source: 'channels/**/*.md',
      schema: channelSchema,
      indexes: [
        { columns: ['contentType'] },
        { columns: ['channelKey'] },
        { columns: ['channelKey', 'tabKey'] },
        { columns: ['sort'] },
      ],
    }),
  },
})
