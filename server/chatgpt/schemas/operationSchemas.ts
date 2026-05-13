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

const ContentRefSchema = z.object({
  resource: ChatGptResourceSchema,
  id: z.number().int().positive(),
})

export const ChatGptOperationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('content.create'),
    resource: ChatGptResourceSchema,
    data: z.record(z.string(), z.unknown()),
  }),

  z.object({
    operation: z.literal('content.get'),
    resource: ChatGptResourceSchema,
    id: z.number().int().positive(),
  }),

  z.object({
    operation: z.literal('content.list'),
    resource: ChatGptResourceSchema,
    filter: z.record(z.string(), z.unknown()).optional().default({}),
  }),

  z.object({
    operation: z.literal('content.update'),
    resource: ChatGptResourceSchema,
    id: z.number().int().positive(),
    data: z.record(z.string(), z.unknown()),
  }),

  z.object({
    operation: z.literal('content.setActive'),
    resource: ChatGptResourceSchema,
    id: z.number().int().positive(),
    isActive: z.boolean(),
  }),

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
    operation: z.literal('image.upload'),
    data: z.record(z.string(), z.unknown()),
  }),

  z.object({
    operation: z.literal('image.get'),
    id: z.number().int().positive(),
    format: z
      .enum(['metadata', 'dataUrl', 'path'])
      .optional()
      .default('metadata'),
  }),
])

export type ChatGptOperation = z.infer<typeof ChatGptOperationSchema>
