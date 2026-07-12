// /server/chatgpt/services/currentImageService.ts
import { createError } from 'h3'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import {
  ChatGptImageFormatSchema,
  ContentRefSchema,
  type ChatGptImageFormat,
  type ContentRef,
} from '../schemas/operationSchemas'
import { addRelation } from './currentRelationService'

const DEFAULT_FILE_TYPE = 'png'
const DEFAULT_MIME = 'image/png'
const DEFAULT_THUMBNAIL_SIZE = 256
const DATA_URL_PATTERN = /^data:([^;,]+)?(;base64)?,(.*)$/s

const ImageConnectRefSchema = ContentRefSchema.refine(
  (ref) =>
    [
      'artCollection',
      'bot',
      'character',
      'chat',
      'composition',
      'dream',
      'facet',
      'project',
      'prompt',
      'resource',
      'reward',
      'scenario',
      'user',
    ].includes(ref.resource),
  {
    message: 'This resource cannot be connected directly to an uploaded image',
  },
)

const OptionalTextSchema = z.string().trim().min(1).optional()

const ImageUploadSchema = z
  .object({
    imageData: z.string().trim().min(1),
    thumbnailData: OptionalTextSchema,
    heroData: OptionalTextSchema,
    cardData: OptionalTextSchema,
    iconData: OptionalTextSchema,
    fileName: z.string().trim().min(1).max(764).optional(),
    fileType: z.string().trim().min(1).max(128).optional(),
    name: z.string().trim().min(1).max(764).optional(),
    title: z.string().trim().min(1).max(764).optional(),
    description: OptionalTextSchema,
    summary: OptionalTextSchema,
    imagePath: OptionalTextSchema,
    heroPath: OptionalTextSchema,
    cardPath: OptionalTextSchema,
    iconPath: OptionalTextSchema,
    thumbnailPath: OptionalTextSchema,
    path: z.string().trim().min(1).max(764).optional(),
    promptString: OptionalTextSchema,
    negativePrompt: OptionalTextSchema,
    checkpoint: z.string().trim().min(1).max(256).optional(),
    checkpointResourceId: z.number().int().positive().optional(),
    sampler: z.string().trim().min(1).max(764).optional(),
    seed: z.number().int().optional(),
    steps: z.number().int().positive().optional(),
    cfg: z.number().int().optional(),
    cfgHalf: z.boolean().optional(),
    designer: z.string().trim().min(1).max(764).optional(),
    genres: OptionalTextSchema,
    serverId: z.number().int().positive().optional(),
    serverName: z.string().trim().min(1).max(256).optional(),
    serverUrl: z.string().trim().min(1).max(764).optional(),
    artPrompt: OptionalTextSchema,
    isPublic: z.boolean().optional(),
    isMature: z.boolean().optional(),
    isActive: z.boolean().optional(),
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

type ArtImageDelegate = {
  fields?: Record<string, unknown>
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findUnique(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>
}

function isAdminActor(actor: ChatGptActor): boolean {
  return actor.role === 'admin'
}

function getArtImageDelegate(): ArtImageDelegate {
  const delegate = (prisma as unknown as { artImage?: ArtImageDelegate }).artImage

  if (!delegate) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Prisma delegate not found for artImage',
    })
  }

  return delegate
}

function getArtImageScalarFields(): Set<string> {
  const fields = new Set(Object.keys(getArtImageDelegate().fields ?? {}))

  if (!fields.size) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Prisma scalar field metadata is unavailable for artImage',
    })
  }

  return fields
}

function buildArtImageSelect({
  includeData = false,
}: {
  includeData?: boolean
} = {}): Record<string, boolean> {
  const dataFields = new Set([
    'imageData',
    'thumbnailData',
    'heroData',
    'cardData',
    'iconData',
  ])

  return Object.fromEntries(
    [...getArtImageScalarFields()]
      .filter((field) => includeData || !dataFields.has(field))
      .map((field) => [field, true]),
  )
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
  if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg'
  if (normalized === 'png') return 'image/png'
  if (normalized === 'webp') return 'image/webp'
  if (normalized === 'gif') return 'image/gif'
  if (normalized === 'avif') return 'image/avif'
  if (normalized === 'svg') return 'image/svg+xml'

  return normalized.startsWith('image/') ? normalized : `image/${normalized}`
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

  if (!base64) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Image data URL is missing base64 content',
    })
  }

  return {
    base64: base64.trim(),
    mime: match[1]?.trim(),
  }
}

function assertValidImageData(imageData: string) {
  const { base64 } = stripDataUrlPrefix(imageData)
  const cleanBase64 = base64.replace(/\s/g, '')

  if (!cleanBase64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Image data is not valid base64',
    })
  }

  const bytes = Buffer.from(cleanBase64, 'base64').byteLength

  if (!bytes) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Image data could not be decoded',
    })
  }

  return {
    base64: cleanBase64,
    bytes,
  }
}

function normalizeDataUrl(imageData: string, fileType: string): string {
  if (DATA_URL_PATTERN.test(imageData)) return imageData

  return `data:${normalizeMime(fileType)};base64,${imageData}`
}

function inferFileTypeFromDataUrl(imageData: string): string | undefined {
  const match = imageData.match(DATA_URL_PATTERN)
  const mime = match?.[1]

  return mime ? normalizeFileType(mime) : undefined
}

function createDefaultFileName(fileType: string): string {
  return `kind-robots-image-${Date.now()}.${fileType}`
}

function normalizeOptionalDataUrl(
  imageData: string | undefined,
  fileType: string,
): string | undefined {
  if (!imageData) return undefined

  assertValidImageData(imageData)
  return normalizeDataUrl(imageData, fileType)
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
}): Record<string, unknown> {
  const promptString =
    input.promptString ||
    input.description ||
    input.summary ||
    input.title ||
    input.name

  return {
    imageData: normalizeDataUrl(input.imageData, fileType),
    thumbnailData: normalizeOptionalDataUrl(input.thumbnailData, fileType),
    heroData: normalizeOptionalDataUrl(input.heroData, fileType),
    cardData: normalizeOptionalDataUrl(input.cardData, fileType),
    iconData: normalizeOptionalDataUrl(input.iconData, fileType),
    fileName,
    fileType,
    imagePath: input.imagePath,
    heroPath: input.heroPath,
    cardPath: input.cardPath,
    iconPath: input.iconPath,
    thumbnailPath: input.thumbnailPath,
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
    serverId: input.serverId,
    serverName: input.serverName,
    serverUrl: input.serverUrl,
    artPrompt: input.artPrompt,
    userId: actor.userId,
    isPublic: input.isPublic ?? true,
    isMature: input.isMature ?? false,
    isActive: input.isActive ?? true,
  }
}

function removeUndefinedValues(
  data: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  )
}

function getBase64Bytes(imageData?: string | null): number {
  if (!imageData) return 0

  const { base64 } = stripDataUrlPrefix(imageData)
  return Buffer.from(base64.replace(/\s/g, ''), 'base64').byteLength
}

function assertReadableImage({
  actor,
  image,
}: {
  actor: ChatGptActor
  image: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return
  if (image.userId === actor.userId) return
  if (image.isPublic === true) return

  throw createError({
    statusCode: 403,
    statusMessage: 'You cannot read this image',
  })
}

function toMetadataResponse(image: Record<string, unknown>) {
  const dataFields = [
    'imageData',
    'thumbnailData',
    'heroData',
    'cardData',
    'iconData',
  ]
  const metadata = Object.fromEntries(
    Object.entries(image).filter(([field]) => !dataFields.includes(field)),
  )

  return {
    ...metadata,
    hasImageData: Boolean(String(image.imageData ?? '').trim()),
    hasThumbnailData: Boolean(String(image.thumbnailData ?? '').trim()),
    hasHeroData: Boolean(String(image.heroData ?? '').trim()),
    hasCardData: Boolean(String(image.cardData ?? '').trim()),
    hasIconData: Boolean(String(image.iconData ?? '').trim()),
    imageDataBytes: getBase64Bytes(image.imageData as string | null | undefined),
    thumbnailDataBytes: getBase64Bytes(
      image.thumbnailData as string | null | undefined,
    ),
  }
}

function toPathResponse(image: Record<string, unknown>) {
  return {
    id: image.id,
    fileName: image.fileName,
    fileType: image.fileType,
    imagePath: image.imagePath,
    heroPath: image.heroPath,
    cardPath: image.cardPath,
    iconPath: image.iconPath,
    thumbnailPath: image.thumbnailPath,
    path: image.path,
  }
}

function normalizeDimension(value?: number): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined

  const normalized = Math.floor(value)
  return normalized > 0 ? normalized : undefined
}

function toDataUrlResponse(
  image: Record<string, unknown>,
  displayOptions: ImageDisplayInput,
) {
  const imageData =
    typeof image.imageData === 'string' ? image.imageData : undefined
  const thumbnailData =
    typeof image.thumbnailData === 'string' ? image.thumbnailData : undefined
  const sourceData =
    displayOptions.thumbnail && thumbnailData ? thumbnailData : imageData

  if (!sourceData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image data is not available for this artImage',
    })
  }

  const dataInfo = stripDataUrlPrefix(sourceData)
  const mime = dataInfo.mime || normalizeMime(String(image.fileType ?? 'png'))
  const maxWidth = displayOptions.thumbnail
    ? DEFAULT_THUMBNAIL_SIZE
    : normalizeDimension(displayOptions.maxWidth)
  const maxHeight = displayOptions.thumbnail
    ? DEFAULT_THUMBNAIL_SIZE
    : normalizeDimension(displayOptions.maxHeight)

  return {
    id: image.id,
    fileName: image.fileName,
    fileType: image.fileType,
    dataUrl: normalizeDataUrl(dataInfo.base64, normalizeFileType(mime)),
    mime,
    bytes: Buffer.from(dataInfo.base64, 'base64').byteLength,
    thumbnail: Boolean(displayOptions.thumbnail),
    usedStoredThumbnail: Boolean(displayOptions.thumbnail && thumbnailData),
    maxWidth,
    maxHeight,
    requestedQuality: displayOptions.quality,
    resized: false,
    transformMode: 'client-display-cap',
  }
}

async function connectImageToRecords({
  actor,
  imageId,
  refs,
}: {
  actor: ChatGptActor
  imageId: number
  refs?: ContentRef[]
}) {
  if (!refs?.length) return

  const uniqueRefs = [
    ...new Map(refs.map((ref) => [`${ref.resource}:${ref.id}`, ref])).values(),
  ]

  for (const ref of uniqueRefs) {
    await addRelation({
      actor,
      from: ref,
      to: {
        resource: 'artImage',
        id: imageId,
      },
    })
  }
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

  const delegate = getArtImageDelegate()
  const fileType = normalizeFileType(
    input.fileType || inferFileTypeFromDataUrl(input.imageData),
  )
  const fileName =
    input.fileName ||
    input.name ||
    input.title ||
    createDefaultFileName(fileType)

  const image = await delegate.create({
    data: removeUndefinedValues(
      buildCreateData({
        input,
        fileType,
        fileName,
        actor,
      }),
    ),
    select: buildArtImageSelect(),
  })
  const imageId = Number(image.id)

  await connectImageToRecords({
    actor,
    imageId,
    refs: input.connectTo,
  })

  const connectedImage = await delegate.findUnique({
    where: { id: imageId },
    select: buildArtImageSelect(),
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
  const includeData = parsedFormat !== 'path'
  const image = await getArtImageDelegate().findUnique({
    where: { id },
    select: buildArtImageSelect({ includeData }),
  })

  if (!image) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found',
    })
  }

  assertReadableImage({ actor, image })

  const data =
    parsedFormat === 'path'
      ? toPathResponse(image)
      : parsedFormat === 'dataUrl'
        ? toDataUrlResponse(image, {
            thumbnail,
            maxWidth,
            maxHeight,
            quality,
          })
        : toMetadataResponse(image)

  return {
    success: true,
    operation: 'image.get',
    data,
  }
}
