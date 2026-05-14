// /server/chatgpt/schemas/operationSchemas.ts
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

export const ChatGptImageFormatSchema = z.enum(['metadata', 'dataUrl', 'path'])

export type ChatGptImageFormat = z.infer<typeof ChatGptImageFormatSchema>

const PositiveIntSchema = z.number().int().positive()

const FlexibleObjectSchema = z.object({}).catchall(z.unknown())

const FilterSchema = FlexibleObjectSchema.optional().default({})

export const ContentRefSchema = z
  .object({
    resource: ChatGptResourceSchema,
    id: PositiveIntSchema,
  })
  .strict()

export type ContentRef = z.infer<typeof ContentRefSchema>

export const ImageUploadDataSchema = z
  .object({
    imageData: z.string().trim().min(1),
    fileName: z.string().trim().min(1).optional(),
    fileType: z.string().trim().min(1).optional(),
    promptString: z.string().trim().min(1).optional(),
    designer: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    connectTo: z.array(ContentRefSchema).optional(),
  })
  .catchall(z.unknown())

export type ImageUploadData = z.infer<typeof ImageUploadDataSchema>

export const ChatGptOperationSchema = z.discriminatedUnion('operation', [
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

  z
    .object({
      operation: z.literal('image.upload'),
      data: ImageUploadDataSchema,
    })
    .strict(),

  z
    .object({
      operation: z.literal('image.get'),
      id: z.number().int().positive(),
      format: ChatGptImageFormatSchema.optional(),
      thumbnail: z.boolean().optional(),
      maxWidth: z.number().int().positive().optional(),
      maxHeight: z.number().int().positive().optional(),
      quality: z.number().int().positive().max(100).optional(),
    })
    .strict(),

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
      operation: z.literal('relation.list'),
      from: ContentRefSchema,
      toResource: ChatGptResourceSchema.optional(),
    })
    .strict(),

  z
    .object({
      operation: z.literal('meta.describe'),
    })
    .strict(),
])

export type ChatGptOperation = z.infer<typeof ChatGptOperationSchema>

export type ChatGptOperationName = ChatGptOperation['operation']

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

export type ImageUploadOperation = Extract<
  ChatGptOperation,
  { operation: 'image.upload' }
>

export type ImageGetOperation = Extract<
  ChatGptOperation,
  { operation: 'image.get' }
>

export type RelationAddOperation = Extract<
  ChatGptOperation,
  { operation: 'relation.add' }
>

export type RelationRemoveOperation = Extract<
  ChatGptOperation,
  { operation: 'relation.remove' }
>

export type RelationListOperation = Extract<
  ChatGptOperation,
  { operation: 'relation.list' }
>

export type MetaDescribeOperation = Extract<
  ChatGptOperation,
  { operation: 'meta.describe' }
>
