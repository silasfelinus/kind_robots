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

const PositiveIntSchema = z.number().int().positive()

const FlexibleObjectSchema = z.object({}).catchall(z.unknown())

const OptionalFlexibleObjectSchema = FlexibleObjectSchema.optional()

const FilterSchema = FlexibleObjectSchema.optional().default({})

export const ContentRefSchema = z
  .object({
    resource: ChatGptResourceSchema,
    id: PositiveIntSchema,
  })
  .strict()

export type ContentRef = z.infer<typeof ContentRefSchema>

export const ChatGptOperationSchema = z.discriminatedUnion('operation', [
  /**
   * Content operations
   */

  z
    .object({
      operation: z.literal('content.create'),
      resource: ChatGptResourceSchema,
      data: FlexibleObjectSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('content.get'),
      resource: ChatGptResourceSchema,
      id: PositiveIntSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('content.list'),
      resource: ChatGptResourceSchema,
      filter: FilterSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('content.update'),
      resource: ChatGptResourceSchema,
      id: PositiveIntSchema,
      data: FlexibleObjectSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('content.setActive'),
      resource: ChatGptResourceSchema,
      id: PositiveIntSchema,
      isActive: z.boolean(),
    })
    .strict(),

  /**
   * Relation operations
   */

  z
    .object({
      operation: z.literal('relation.add'),
      from: ContentRefSchema,
      to: ContentRefSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('relation.remove'),
      from: ContentRefSchema,
      to: ContentRefSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('relation.set'),
      from: ContentRefSchema,
      toResource: ChatGptResourceSchema,
      ids: z.array(PositiveIntSchema).min(1),
    })
    .strict(),

  z
    .object({
      operation: z.literal('relation.list'),
      from: ContentRefSchema,
      toResource: ChatGptResourceSchema.optional(),
    })
    .strict(),

  /**
   * Image operations
   */

  z
    .object({
      operation: z.literal('image.upload'),
      data: FlexibleObjectSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('image.get'),
      id: PositiveIntSchema,
      format: ChatGptImageFormatSchema.optional().default('metadata'),
    })
    .strict(),

  /**
   * User operations
   */

  z
    .object({
      operation: z.literal('user.me'),
    })
    .strict(),

  z
    .object({
      operation: z.literal('user.register'),
      data: FlexibleObjectSchema,
    })
    .strict(),

  /**
   * Generator operations
   */

  z
    .object({
      operation: z.literal('generator.run'),
      generator: ChatGptGeneratorSchema,
      input: FlexibleObjectSchema,
      save: OptionalFlexibleObjectSchema,
    })
    .strict(),

  /**
   * Bundle operations
   */

  z
    .object({
      operation: z.literal('bundle.create'),
      data: FlexibleObjectSchema,
    })
    .strict(),

  /**
   * Meta operations
   */

  z
    .object({
      operation: z.literal('meta.describe'),
    })
    .strict(),
])

export type ChatGptOperation = z.infer<typeof ChatGptOperationSchema>

export type ContentCreateOperation = Extract<
  ChatGptOperation,
  { operation: 'content.create' }
>

export type ContentGetOperation = Extract<
  ChatGptOperation,
  { operation: 'content.get' }
>

export type ContentListOperation = Extract<
  ChatGptOperation,
  { operation: 'content.list' }
>

export type ContentUpdateOperation = Extract<
  ChatGptOperation,
  { operation: 'content.update' }
>

export type ContentSetActiveOperation = Extract<
  ChatGptOperation,
  { operation: 'content.setActive' }
>