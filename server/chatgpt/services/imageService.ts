// /server/chatgpt/services/imageService.ts
import { createError } from 'h3'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import {
  ChatGptImageFormatSchema,
  type ChatGptImageFormat,
} from '../schemas/operationSchemas'

const CURRENT_ADMIN_USER_ID = 1
const DEFAULT_FILE_TYPE = 'png'
const DATA_URL_PATTERN = /^data:([^;,]+)?(;base64)?,(.*)$/s

const ImageConnectResourceSchema = z.enum([
  'art',
  'artCollection',
  'bot',
  'character',
  'chat',
  'component',
  'dream',
  'milestone',
  'pitch',
  'prompt',
  'reaction',
  'resource',
  'reward',
  'scenario',
  'server',
  'tag',
  'user',
])

type ImageConnectResource = z.infer<typeof ImageConnectResourceSchema>

const ImageConnectRefSchema = z
  .object({
    resource: ImageConnectResourceSchema,
    id: z.number().int().positive(),
  })
  .strict()

const ImageUploadSchema = z
  .object({
    imageData: z.string().trim().min(1),
    thumbnailData: z.string().trim().min(1).optional(),
    fileName: z.string().trim().min(1).max(764).optional(),
    fileType: z.string().trim().min(1).max(128).optional(),
    imagePath: z.string().trim().min(1).optional(),
    path: z.string().trim().min(1).max(764).optional(),
    promptString: z.string().trim().min(1).optional(),
    negativePrompt: z.string().trim().min(1).optional(),
    checkpoint: z.string().trim().min(1).max(256).optional(),
    checkpointResourceId: z.number().int().positive().optional(),
    sampler: z.string().trim().min(1).max(764).optional(),
    seed: z.number().int().optional(),
    steps: z.number().int().positive().optional(),
    cfg: z.number().int().optional(),
    cfgHalf: z.boolean().optional(),
    designer: z.string().trim().min(1).max(764).optional(),
    genres: z.string().trim().min(1).optional(),
    rarity: z.number().int().optional(),
    galleryId: z.number().int().positive().optional(),
    serverId: z.number().int().positive().optional(),
    serverName: z.string().trim().min(1).max(256).optional(),
    serverUrl: z.string().trim().min(1).max(764).optional(),
    isPublic: z.boolean().optional(),
    isMature: z.boolean().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(256)).optional(),
    connectTo: z.array(ImageConnectRefSchema).optional(),
  })
  .strict()

type ImageUploadInput = z.infer<typeof ImageUploadSchema>

type ImageServiceResponse<TData = unknown> = {
  success: true
  operation: 'image.upload' | 'image.get'
  data: TData
  message?: string
}

type PrismaDelegate = {
  findUnique(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

type ArtImageDelegate = PrismaDelegate & {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

const artImageMetadataSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  galleryId: true,
  userId: true,
  fileName: true,
  fileType: true,
  imagePath: true,
  rarity: true,
  path: true,
  promptString: true,
  negativePrompt: true,
  checkpoint: true,
  checkpointResourceId: true,
  sampler: true,
  seed: true,
  steps: true,
  cfg: true,
  cfgHalf: true,
  designer: true,
  genres: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  serverId: true,
  serverName: true,
  serverUrl: true,
  artId: true,
  botId: true,
  componentId: true,
  milestoneId: true,
  pitchId: true,
  promptId: true,
  resourceId: true,
  rewardId: true,
  chatId: true,
  characterId: true,
  butterflyId: true,
} satisfies Record<string, boolean>

const artImageFullSelect = {
  ...artImageMetadataSelect,
  imageData: true,
  thumbnailData: true,
} satisfies Record<string, boolean>

const resourceDelegateMap = {
  art: 'art',
  artCollection: 'artCollection',
  bot: 'bot',
  character: 'character',
  chat: 'chat',
  component: 'component',
  dream: 'dream',
  milestone: 'milestone',
  pitch: 'pitch',
  prompt: 'prompt',
  reaction: 'reaction',
  resource: 'resource',
  reward: 'reward',
  scenario: 'scenario',
  server: 'server',
  tag: 'tag',
  user: 'user',
} satisfies Record<ImageConnectResource, string>

const parentImageFieldByResource: Partial<
  Record<ImageConnectResource, string>
> = {
  bot: 'artImageId',
  character: 'artImageId',
  chat: 'artImageId',
  component: 'artImageId',
  dream: 'artImageId',
  pitch: 'artImageId',
  prompt: 'artImageId',
  resource: 'artImageId',
  reward: 'artImageId',
  scenario: 'artImageId',
  tag: 'artImageId',
  user: 'artImageId',
}

const directArtImageForeignKeyByResource: Partial<
  Record<ImageConnectResource, string>
> = {
  art: 'artId',
  bot: 'botId',
  character: 'characterId',
  chat: 'chatId',
  component: 'componentId',
  milestone: 'milestoneId',
  pitch: 'pitchId',
  prompt: 'promptId',
  resource: 'resourceId',
  reward: 'rewardId',
}

const collectionRelationByResource: Partial<
  Record<ImageConnectResource, string>
> = {
  artCollection: 'ArtCollections',
  dream: 'Dreams',
  reaction: 'Reactions',
  scenario: 'Scenarios',
  tag: 'Tags',
}

function getActorUserId(actor: ChatGptActor): number {
  return actor.userId || CURRENT_ADMIN_USER_ID
}

function isAdminActor(actor: ChatGptActor): boolean {
  return actor.role === 'admin' || actor.userId === CURRENT_ADMIN_USER_ID
}

function getDelegate(resource: ImageConnectResource): PrismaDelegate {
  const delegateName = resourceDelegateMap[resource]
  const delegate = (
    prisma as unknown as Record<string, PrismaDelegate | undefined>
  )[delegateName]

  if (!delegate) {
    throw createError({
      statusCode: 500,
      statusMessage: `Prisma delegate not found for ${resource}`,
    })
  }

  return delegate
}

function getArtImageDelegate(): ArtImageDelegate {
  const delegate = (prisma as unknown as { artImage?: ArtImageDelegate })
    .artImage

  if (!delegate) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Prisma delegate not found for artImage',
    })
  }

  return delegate
}

function normalizeFileType(input?: string): string {
  if (!input) return DEFAULT_FILE_TYPE

  return input
    .replace(/^image\//i, '')
    .replace(/^\./, '')
    .trim()
    .toLowerCase()
}

function inferFileTypeFromDataUrl(imageData: string): string | undefined {
  const match = imageData.match(DATA_URL_PATTERN)
  const mime = match?.[1]

  if (!mime) return undefined

  return normalizeFileType(mime)
}

function normalizeDataUrl(imageData: string, fileType: string): string {
  if (DATA_URL_PATTERN.test(imageData)) return imageData

  return `data:image/${fileType};base64,${imageData}`
}

function createDefaultFileName(fileType: string): string {
  return `kind-robots-image-${Date.now()}.${fileType}`
}

function assertReadableImage({
  actor,
  image,
}: {
  actor: ChatGptActor
  image: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return

  const userId = getActorUserId(actor)

  if (image.userId === userId) return
  if (image.isPublic === true) return

  throw createError({
    statusCode: 403,
    statusMessage: 'You cannot read this image',
  })
}

async function assertConnectableRecord({
  actor,
  resource,
  id,
}: {
  actor: ChatGptActor
  resource: ImageConnectResource
  id: number
}) {
  const delegate = getDelegate(resource)

  const record = await delegate.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      isPublic: true,
    },
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  if (isAdminActor(actor)) return

  const userId = getActorUserId(actor)

  if (record.userId === userId) return

  throw createError({
    statusCode: 403,
    statusMessage: `You cannot connect an image to this ${resource}`,
  })
}

async function findOrCreateTag({
  label,
  actor,
}: {
  label: string
  actor: ChatGptActor
}): Promise<{ id: number }> {
  const existingTag = await prisma.tag.findFirst({
    where: {
      label,
      userId: getActorUserId(actor),
    },
    select: {
      id: true,
    },
  })

  if (existingTag) return existingTag

  return prisma.tag.create({
    data: {
      label,
      title: label,
      userId: getActorUserId(actor),
      isPublic: true,
      isMature: false,
      isActive: true,
    },
    select: {
      id: true,
    },
  })
}

async function createOrConnectTags({
  imageId,
  tags,
  actor,
}: {
  imageId: number
  tags?: string[]
  actor: ChatGptActor
}) {
  if (!tags?.length) return

  const uniqueTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]

  if (!uniqueTags.length) return

  await Promise.all(
    uniqueTags.map(async (label) => {
      const tag = await findOrCreateTag({
        label,
        actor,
      })

      await prisma.artImage.update({
        where: {
          id: imageId,
        },
        data: {
          Tags: {
            connect: {
              id: tag.id,
            },
          },
        },
        select: {
          id: true,
        },
      })
    }),
  )
}

async function connectImageToRecord({
  imageId,
  ref,
  actor,
}: {
  imageId: number
  ref: z.infer<typeof ImageConnectRefSchema>
  actor: ChatGptActor
}) {
  await assertConnectableRecord({
    actor,
    resource: ref.resource,
    id: ref.id,
  })

  const artImageDelegate = getArtImageDelegate()
  const directForeignKey = directArtImageForeignKeyByResource[ref.resource]

  if (directForeignKey) {
    await artImageDelegate.update({
      where: { id: imageId },
      data: {
        [directForeignKey]: ref.id,
      },
      select: {
        id: true,
      },
    })
  }

  const parentImageField = parentImageFieldByResource[ref.resource]

  if (parentImageField) {
    const delegate = getDelegate(ref.resource)

    await delegate.update({
      where: {
        id: ref.id,
      },
      data: {
        [parentImageField]: imageId,
      },
      select: {
        id: true,
      },
    })
  }

  const collectionRelation = collectionRelationByResource[ref.resource]

  if (collectionRelation) {
    await artImageDelegate.update({
      where: { id: imageId },
      data: {
        [collectionRelation]: {
          connect: {
            id: ref.id,
          },
        },
      },
      select: {
        id: true,
      },
    })
  }
}

async function connectImageToRecords({
  imageId,
  refs,
  actor,
}: {
  imageId: number
  refs?: z.infer<typeof ImageConnectRefSchema>[]
  actor: ChatGptActor
}) {
  if (!refs?.length) return

  const uniqueRefs = [
    ...new Map(refs.map((ref) => [`${ref.resource}:${ref.id}`, ref])).values(),
  ]

  await Promise.all(
    uniqueRefs.map((ref) =>
      connectImageToRecord({
        imageId,
        ref,
        actor,
      }),
    ),
  )
}

function buildCreateData({
  input,
  fileType,
  fileName,
  actor,
}: {
  input: ImageUploadInput
  fileType: string
  fileName: string
  actor: ChatGptActor
}) {
  return {
    imageData: input.imageData,
    thumbnailData: input.thumbnailData,
    fileName,
    fileType,
    imagePath: input.imagePath,
    path: input.path,
    promptString: input.promptString,
    negativePrompt: input.negativePrompt,
    checkpoint: input.checkpoint,
    checkpointResourceId: input.checkpointResourceId,
    sampler: input.sampler,
    seed: input.seed,
    steps: input.steps,
    cfg: input.cfg,
    cfgHalf: input.cfgHalf,
    designer: input.designer,
    genres: input.genres,
    rarity: input.rarity,
    galleryId: input.galleryId,
    serverId: input.serverId,
    serverName: input.serverName,
    serverUrl: input.serverUrl,
    userId: getActorUserId(actor),
    isPublic: input.isPublic ?? true,
    isMature: input.isMature ?? false,
    isActive: input.isActive ?? true,
  }
}

function toPathResponse(image: Record<string, unknown>) {
  return {
    id: image.id,
    fileName: image.fileName,
    fileType: image.fileType,
    imagePath: image.imagePath,
    path: image.imagePath || image.path,
  }
}

function toDataUrlResponse(image: Record<string, unknown>) {
  const fileType = normalizeFileType(
    String(image.fileType || DEFAULT_FILE_TYPE),
  )
  const imageData = typeof image.imageData === 'string' ? image.imageData : null

  if (!imageData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image data is not available for this artImage',
    })
  }

  return {
    ...image,
    dataUrl: normalizeDataUrl(imageData, fileType),
  }
}

function toImageResponse({
  image,
  format,
}: {
  image: Record<string, unknown>
  format: ChatGptImageFormat
}) {
  if (format === 'path') return toPathResponse(image)
  if (format === 'dataUrl') return toDataUrlResponse(image)

  return image
}

export async function uploadImage({
  data,
  actor,
}: {
  data: unknown
  actor: ChatGptActor
}): Promise<ImageServiceResponse<Record<string, unknown>>> {
  const input = ImageUploadSchema.parse(data)
  const artImageDelegate = getArtImageDelegate()
  const inferredFileType = inferFileTypeFromDataUrl(input.imageData)
  const fileType = normalizeFileType(input.fileType || inferredFileType)
  const fileName = input.fileName || createDefaultFileName(fileType)

  const image = await artImageDelegate.create({
    data: buildCreateData({
      input,
      fileType,
      fileName,
      actor,
    }),
    select: artImageMetadataSelect,
  })

  const imageId = Number(image.id)

  await connectImageToRecords({
    imageId,
    refs: input.connectTo,
    actor,
  })

  await createOrConnectTags({
    imageId,
    tags: input.tags,
    actor,
  })

  const connectedImage = await artImageDelegate.findUnique({
    where: { id: imageId },
    select: artImageMetadataSelect,
  })

  if (!connectedImage) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Image was created but could not be read afterward',
    })
  }

  return {
    success: true,
    operation: 'image.upload',
    data: connectedImage,
    message: 'Image uploaded successfully.',
  }
}

export async function getImage({
  id,
  format = 'metadata',
  actor,
}: {
  id: number
  format?: ChatGptImageFormat
  actor: ChatGptActor
}): Promise<ImageServiceResponse<Record<string, unknown>>> {
  const parsedFormat = ChatGptImageFormatSchema.parse(format)
  const artImageDelegate = getArtImageDelegate()

  const image = await artImageDelegate.findUnique({
    where: { id },
    select:
      parsedFormat === 'dataUrl' ? artImageFullSelect : artImageMetadataSelect,
  })

  if (!image) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found',
    })
  }

  assertReadableImage({
    actor,
    image,
  })

  return {
    success: true,
    operation: 'image.get',
    data: toImageResponse({
      image,
      format: parsedFormat,
    }),
  }
}
