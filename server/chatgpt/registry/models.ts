import { z } from 'zod'
import type { ChatGptResource } from '../schemas/operationSchemas'

const BaseFlagsSchema = z.object({
  isPublic: z.boolean().optional(),
  isMature: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const CharacterCreateSchema = BaseFlagsSchema.extend({
  name: z.string().min(1).max(256),
  honorific: z.string().optional(),
  species: z.string().optional(),
  class: z.string().optional(),
  genre: z.string().optional(),
  personality: z.string().optional(),
  backstory: z.string().optional(),
  drive: z.string().optional(),
  inventory: z.string().optional(),
  quirks: z.string().optional(),
  skills: z.string().optional(),
  artPrompt: z.string().optional(),
  imagePath: z.string().optional(),
  artImageId: z.number().int().optional(),
})

export const CharacterUpdateSchema = CharacterCreateSchema.partial().omit({
  // name can stay editable; remove this omit if you want name editable too.
})

export const DreamCreateSchema = BaseFlagsSchema.extend({
  title: z.string().min(1).max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  currentVibe: z.string().min(1),
  currentPrompt: z.string().optional(),
  artImageId: z.number().int().optional(),
  artCollectionId: z.number().int().optional(),
  scenarioId: z.number().int().optional(),
})

export const DreamUpdateSchema = DreamCreateSchema.partial()

export const ArtImageCreateSchema = BaseFlagsSchema.extend({
  imageData: z.string().min(1),
  thumbnailData: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  imagePath: z.string().optional(),
  promptString: z.string().optional(),
  negativePrompt: z.string().optional(),
  checkpoint: z.string().optional(),
  sampler: z.string().optional(),
  seed: z.number().int().optional(),
  steps: z.number().int().optional(),
  cfg: z.number().optional(),
  designer: z.string().optional(),
  genres: z.string().optional(),
})

export const ArtImageUpdateSchema = ArtImageCreateSchema.partial()

type ModelConfig = {
  prisma: string
  ownerField: string
  activeField: string
  createSchema: z.ZodTypeAny
  updateSchema: z.ZodTypeAny
  publicSelect: Record<string, boolean>
}

export const CHATGPT_MODEL_REGISTRY = {
  character: {
    prisma: 'character',
    ownerField: 'userId',
    activeField: 'isActive',
    createSchema: CharacterCreateSchema,
    updateSchema: CharacterUpdateSchema,
    publicSelect: {
      id: true,
      name: true,
      honorific: true,
      species: true,
      class: true,
      genre: true,
      personality: true,
      backstory: true,
      drive: true,
      inventory: true,
      quirks: true,
      skills: true,
      artPrompt: true,
      imagePath: true,
      artImageId: true,
      isPublic: true,
      isMature: true,
      isActive: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  dream: {
    prisma: 'dream',
    ownerField: 'userId',
    activeField: 'isActive',
    createSchema: DreamCreateSchema,
    updateSchema: DreamUpdateSchema,
    publicSelect: {
      id: true,
      title: true,
      slug: true,
      description: true,
      currentVibe: true,
      currentPrompt: true,
      artImageId: true,
      artCollectionId: true,
      scenarioId: true,
      isPublic: true,
      isMature: true,
      isActive: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  artImage: {
    prisma: 'artImage',
    ownerField: 'userId',
    activeField: 'isActive',
    createSchema: ArtImageCreateSchema,
    updateSchema: ArtImageUpdateSchema,
    publicSelect: {
      id: true,
      fileName: true,
      fileType: true,
      imagePath: true,
      promptString: true,
      negativePrompt: true,
      designer: true,
      genres: true,
      isPublic: true,
      isMature: true,
      isActive: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Partial<Record<ChatGptResource, ModelConfig>>

export function getModelConfig(resource: ChatGptResource): ModelConfig {
  const registry: Partial<Record<ChatGptResource, ModelConfig>> =
    CHATGPT_MODEL_REGISTRY

  const config = registry[resource]

  if (!config) {
    throw createError({
      statusCode: 400,
      statusMessage: `Resource not implemented yet: ${resource}`,
    })
  }

  return config
}
