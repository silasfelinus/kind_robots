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
const DEFAULT_MIME = 'image/png'
const DEFAULT_THUMBNAIL_SIZE = 256
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
    imageData: z
      .string()
      .trim()
      .min(1, 'imageData is required and must be base64 image data'),

    thumbnailData: z.string().trim().min(1).optional(),

    fileName: z.string().trim().min(1).max(764).optional(),
    fileType: z.string().trim().min(1).max(128).optional(),

    // Friendly aliases from GPT/tools/frontends
    name: z.string().trim().min(1).max(764).optional(),
    title: z.string().trim().min(1).max(764).optional(),
    description: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1).optional(),

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

type ImageDisplayInput = {
  thumbnail?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

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

function assertValidImageData(imageData: string) {
  const { base64 } = stripDataUrlPrefix(imageData)
  const cleanBase64 = base64.replace(/\s/g, '')

  if (!cleanBase64) {
    throw createError({
      statusCode: 422,
      statusMessage: 'imageData is empty after removing data URL prefix',
    })
  }

  const bytes = Buffer.byteLength(cleanBase64, 'base64')

  if (!bytes) {
    throw createError({
      statusCode: 422,
      statusMessage: 'imageData could not be decoded as base64',
    })
  }

  return {
    base64: cleanBase64,
    bytes,
  }
}

const directArtImageForeignKeyByResource: Partial<
  Record<ImageConnectResource, string>
> = {
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

function normalizeFileType(input?: string | null): string {
  if (!input) return DEFAULT_FILE_TYPE

  return input
    .replace(/^image\//i, '')
    .replace(/^\./, '')
    .trim()
    .toLowerCase()
}

function normalizeMime(fileType?: string | null): string {
  const normalized = normalizeFileType(fileType)

  if (!normalized) return DEFAULT_MIME
  if (normalized === 'jpg') return 'image/jpeg'
  if (normalized === 'jpeg') return 'image/jpeg'
  if (normalized === 'png') return 'image/png'
  if (normalized === 'webp') return 'image/webp'
  if (normalized === 'gif') return 'image/gif'
  if (normalized === 'avif') return 'image/avif'
  if (normalized === 'svg') return 'image/svg+xml'

  return normalized.startsWith('image/') ? normalized : `image/${normalized}`
}

function inferFileTypeFromDataUrl(imageData: string): string | undefined {
  const match = imageData.match(DATA_URL_PATTERN)
  const mime = match?.[1]

  if (!mime) return undefined

  return normalizeFileType(mime)
}

function inferMimeFromDataUrl(imageData: string): string | undefined {
  const match = imageData.match(DATA_URL_PATTERN)
  const mime = match?.[1]?.trim()

  if (!mime) return undefined

  return mime
}

function stripDataUrlPrefix(imageData: string): {
  base64: string
  mime?: string
} {
  const match = imageData.match(DATA_URL_PATTERN)

  if (!match) {
    return {
      base64: imageData.trim(),
    }
  }

  const base64 = match[3]
  const mime = match[1]

  if (!base64) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Image data URL is missing base64 content',
    })
  }

  return {
    base64: base64.trim(),
    mime: mime?.trim(),
  }
}

function normalizeDataUrl(imageData: string, fileType: string): string {
  if (DATA_URL_PATTERN.test(imageData)) return imageData

  return `data:${normalizeMime(fileType)};base64,${imageData}`
}

function createDefaultFileName(fileType: string): string {
  return `kind-robots-image-${Date.now()}.${fileType}`
}

function getBase64Bytes(imageData?: string | null): number {
  if (!imageData) return 0

  const { base64 } = stripDataUrlPrefix(imageData)
  const cleanBase64 = base64.replace(/\s/g, '')

  if (!cleanBase64) return 0

  return Buffer.byteLength(cleanBase64, 'base64')
}

function getStorageMode(
  image: Record<string, unknown>,
): 'imageData' | 'path' | 'unknown' {
  const imageData = typeof image.imageData === 'string' ? image.imageData : ''
  const imagePath = typeof image.imagePath === 'string' ? image.imagePath : ''
  const path = typeof image.path === 'string' ? image.path : ''

  if (imageData.trim()) return 'imageData'
  if (imagePath.trim() || path.trim()) return 'path'

  return 'unknown'
}

function normalizeDimension(value?: number): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined

  const normalized = Math.floor(value)

  if (normalized <= 0) return undefined

  return normalized
}

function getDisplayCap({ thumbnail, maxWidth, maxHeight }: ImageDisplayInput) {
  const width = thumbnail
    ? DEFAULT_THUMBNAIL_SIZE
    : normalizeDimension(maxWidth)
  const height = thumbnail
    ? DEFAULT_THUMBNAIL_SIZE
    : normalizeDimension(maxHeight)

  return {
    width,
    height,
    style: {
      maxWidth: width ? `${width}px` : undefined,
      maxHeight: height ? `${height}px` : undefined,
      width: width ? '100%' : undefined,
      height: 'auto',
      objectFit: 'contain',
    },
  }
}

async function makeDisplayDataUrl({
  imageData,
  fileType,
  thumbnail,
  maxWidth,
  maxHeight,
}: {
  imageData: string
  fileType?: string | null
  maxWidth?: number
  maxHeight?: number
  quality?: number
  thumbnail?: boolean
}) {
  const dataInfo = stripDataUrlPrefix(imageData)
  const inputBuffer = Buffer.from(dataInfo.base64, 'base64')
  const mime = dataInfo.mime || normalizeMime(fileType)
  const dataUrl = normalizeDataUrl(dataInfo.base64, normalizeFileType(mime))
  const displayCap = getDisplayCap({
    thumbnail,
    maxWidth,
    maxHeight,
  })

  if (!inputBuffer.byteLength) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Image data could not be decoded',
    })
  }

  return {
    dataUrl,
    mime,
    bytes: inputBuffer.byteLength,
    resized: false,
    maxWidth: displayCap.width,
    maxHeight: displayCap.height,
    thumbnail: Boolean(thumbnail),
    displayCap,
    transformMode: 'client-display-cap',
  }
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
  const normalizedImageData = normalizeDataUrl(input.imageData, fileType)

  const normalizedThumbnailData = input.thumbnailData
    ? normalizeDataUrl(input.thumbnailData, fileType)
    : undefined

  const promptString =
    input.promptString ||
    input.description ||
    input.summary ||
    input.title ||
    input.name

  return {
    imageData: normalizedImageData,
    thumbnailData: normalizedThumbnailData,

    fileName,
    fileType,

    imagePath: input.imagePath,
    path: input.path,

    promptString,
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
    serverId: input.serverId,
    serverName: input.serverName,
    serverUrl: input.serverUrl,
    userId: getActorUserId(actor),
    isPublic: input.isPublic ?? true,
    isMature: input.isMature ?? false,
    isActive: input.isActive ?? true,
  }
}

function toMetadataResponse(image: Record<string, unknown>) {
  const imageData = typeof image.imageData === 'string' ? image.imageData : null
  const thumbnailData =
    typeof image.thumbnailData === 'string' ? image.thumbnailData : null
  const metadata = Object.fromEntries(
    Object.entries(image).filter(
      ([key]) => key !== 'imageData' && key !== 'thumbnailData',
    ),
  )

  return {
    ...metadata,
    hasImageData: Boolean(imageData?.trim()),
    hasThumbnailData: Boolean(thumbnailData?.trim()),
    imageDataBytes: getBase64Bytes(imageData),
    thumbnailDataBytes: getBase64Bytes(thumbnailData),
    storageMode: getStorageMode(image),
    supportsDisplayCap: true,
    supportsServerResize: false,
  }
}

function toPathResponse(image: Record<string, unknown>) {
  return {
    id: image.id,
    fileName: image.fileName,
    fileType: image.fileType,
    imagePath: image.imagePath,
    path: image.path,
  }
}

async function toDataUrlResponse(
  image: Record<string, unknown>,
  displayOptions: ImageDisplayInput = {},
) {
  const imageData = typeof image.imageData === 'string' ? image.imageData : null
  const thumbnailData =
    typeof image.thumbnailData === 'string' ? image.thumbnailData : null
  const sourceImageData =
    displayOptions.thumbnail && thumbnailData ? thumbnailData : imageData

  if (!sourceImageData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image data is not available for this artImage',
    })
  }

  const dataUrlMime = inferMimeFromDataUrl(sourceImageData)
  const fileTypeFromData = inferFileTypeFromDataUrl(sourceImageData)
  const fallbackFileType = normalizeFileType(
    fileTypeFromData || String(image.fileType || DEFAULT_FILE_TYPE),
  )
  const displayData = await makeDisplayDataUrl({
    imageData: sourceImageData,
    fileType: dataUrlMime || fallbackFileType,
    maxWidth: displayOptions.maxWidth,
    maxHeight: displayOptions.maxHeight,
    quality: displayOptions.quality,
    thumbnail: displayOptions.thumbnail,
  })

  return {
    id: image.id,
    fileName: image.fileName,
    fileType: image.fileType,
    dataUrl: displayData.dataUrl,
    mime: displayData.mime,
    bytes: displayData.bytes,
    resized: displayData.resized,
    maxWidth: displayData.maxWidth,
    maxHeight: displayData.maxHeight,
    thumbnail: displayData.thumbnail,
    usedStoredThumbnail: Boolean(displayOptions.thumbnail && thumbnailData),
    displayCap: displayData.displayCap,
    transformMode: displayData.transformMode,
  }
}

async function toImageResponse({
  image,
  format,
  displayOptions,
}: {
  image: Record<string, unknown>
  format: ChatGptImageFormat
  displayOptions?: ImageDisplayInput
}) {
  if (format === 'path') return toPathResponse(image)
  if (format === 'dataUrl') return toDataUrlResponse(image, displayOptions)

  return toMetadataResponse(image)
}

export async function uploadImage({
  data,
  actor,
}: {
  data: unknown
  actor: ChatGptActor
}): Promise<ImageServiceResponse<Record<string, unknown>>> {
  const input = ImageUploadSchema.parse(data)

  assertValidImageData(input.imageData)

  if (input.thumbnailData) {
    assertValidImageData(input.thumbnailData)
  }

  const artImageDelegate = getArtImageDelegate()
  const inferredFileType = inferFileTypeFromDataUrl(input.imageData)
  const fileType = normalizeFileType(input.fileType || inferredFileType)
  const fileName =
    input.fileName ||
    input.name ||
    input.title ||
    createDefaultFileName(fileType)

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
  thumbnail,
  maxWidth,
  maxHeight,
  quality,
}: {
  id: number
  format?: ChatGptImageFormat
  actor: ChatGptActor
  thumbnail?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: number
}): Promise<ImageServiceResponse<Record<string, unknown>>> {
  const parsedFormat = ChatGptImageFormatSchema.parse(format)
  const artImageDelegate = getArtImageDelegate()

  const image = await artImageDelegate.findUnique({
    where: { id },
    select:
      parsedFormat === 'path' ? artImageMetadataSelect : artImageFullSelect,
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
    data: await toImageResponse({
      image,
      format: parsedFormat,
      displayOptions: {
        thumbnail,
        maxWidth,
        maxHeight,
        quality,
      },
    }),
  }
}
