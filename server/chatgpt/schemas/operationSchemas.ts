import { z } from 'zod'

export const ChatGptResourceSchema = z.enum([
  'artImage',
  'artCollection',
  'bot',
  'character',
  'chat',
  'dream',
  'pitch',
  'prompt',
  'resource',
  'reward',
  'scenario',
  'server',
  'tag',
  'theme',
  'user',
])

export type ChatGptResource = z.infer<typeof ChatGptResourceSchema>

export const ChatGptGeneratorSchema = z.enum([
  'brainstorm',
  'botcafe',
  'storymaker',
  'chat',
  'scenario',
  'image',
])

export type ChatGptGenerator = z.infer<typeof ChatGptGeneratorSchema>

export const ChatGptImageFormatSchema = z.enum(['metadata', 'dataUrl', 'path'])

export type ChatGptImageFormat = z.infer<typeof ChatGptImageFormatSchema>

export const ContentRefSchema = z.object({
  resource: ChatGptResourceSchema,
  id: z.number().int().positive(),
})

export type ContentRef = z.infer<typeof ContentRefSchema>

const DataSchema = z.record(z.string(), z.unknown())

const FilterSchema = z.record(z.string(), z.unknown()).optional().default({})

export const ChatGptOperationSchema = z.discriminatedUnion('operation', [
  /**
   * Content operations
   */

  z.object({
    operation: z.literal('content.create'),
    resource: ChatGptResourceSchema,
    data: DataSchema,
  }),

  z.object({
    operation: z.literal('content.get'),
    resource: ChatGptResourceSchema,
    id: z.number().int().positive(),
  }),

  z.object({
    operation: z.literal('content.list'),
    resource: ChatGptResourceSchema,
    filter: FilterSchema,
  }),

  z.object({
    operation: z.literal('content.update'),
    resource: ChatGptResourceSchema,
    id: z.number().int().positive(),
    data: DataSchema,
  }),

  z.object({
    operation: z.literal('content.setActive'),
    resource: ChatGptResourceSchema,
    id: z.number().int().positive(),
    isActive: z.boolean(),
  }),

  /**
   * Relation operations
   */

  z.object({
    operation: z.literal('relation.add'),
    from: ContentRefSchema,
    to: ContentRefSchema,
  }),

  z.object({
    operation: z.literal('relation.remove'),
    from: ContentRefSchema,
    to: ContentRefSchema,
  }),

  z.object({
    operation: z.literal('relation.set'),
    from: ContentRefSchema,
    toResource: ChatGptResourceSchema,
    ids: z.array(z.number().int().positive()),
  }),

  z.object({
    operation: z.literal('relation.list'),
    from: ContentRefSchema,
    toResource: ChatGptResourceSchema.optional(),
  }),

  /**
   * Image operations
   */

  z.object({
    operation: z.literal('image.upload'),
    data: DataSchema,
  }),

  z.object({
    operation: z.literal('image.get'),
    id: z.number().int().positive(),
    format: ChatGptImageFormatSchema.optional().default('metadata'),
  }),

  /**
   * User operations
   */

  z.object({
    operation: z.literal('user.me'),
  }),

  z.object({
    operation: z.literal('user.register'),
    data: DataSchema,
  }),

  /**
   * Generator operations
   */

  z.object({
    operation: z.literal('generator.run'),
    generator: ChatGptGeneratorSchema,
    input: DataSchema,
    save: DataSchema.optional(),
  }),

  /**
   * Bundle operations
   */

  z.object({
    operation: z.literal('bundle.create'),
    data: DataSchema,
  }),

  /**
   * Meta operations
   */

  z.object({
    operation: z.literal('meta.describe'),
  }),
])

export type ChatGptOperation = z.infer<typeof ChatGptOperationSchema>
