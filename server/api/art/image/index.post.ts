// /server/api/art/image/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

type CreateArtImagePayload = {
  imageData?: unknown
  thumbnailData?: unknown
  fileName?: unknown
  fileType?: unknown
  imagePath?: unknown
  path?: unknown
  promptString?: unknown
  artPrompt?: unknown
  negativePrompt?: unknown
  checkpoint?: unknown
  sampler?: unknown
  seed?: unknown
  steps?: unknown
  cfg?: unknown
  cfgHalf?: unknown
  designer?: unknown
  genres?: unknown
  isPublic?: unknown
  isMature?: unknown
  isActive?: unknown
  serverName?: unknown
  serverUrl?: unknown
}

const ALLOWED_FIELDS = new Set([
  'imageData',
  'thumbnailData',
  'fileName',
  'fileType',
  'imagePath',
  'path',
  'promptString',
  'artPrompt',
  'negativePrompt',
  'checkpoint',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'isPublic',
  'isMature',
  'isActive',
  'serverName',
  'serverUrl',
])

const ALLOWED_FILE_TYPES = new Set(['png', 'jpeg', 'jpg', 'webp', 'gif', 'avif'])
const MAX_IMAGE_DATA_CHARS = 30_000_000
const MAX_THUMBNAIL_DATA_CHARS = 5_000_000

function cleanText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (typeof value === 'undefined' || value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a string.`,
    })
  }

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text && text !== 'UNDEFINED' ? text : null
}

function cleanNumber(value: unknown, fieldName: string): number | null {
  if (typeof value === 'undefined' || value === null || value === '') return null

  const number = Number(value)

  if (!Number.isFinite(number)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a finite number.`,
    })
  }

  return number
}

function cleanInteger(
  value: unknown,
  fieldName: string,
  min: number,
  max: number,
): number | null {
  const number = cleanNumber(value, fieldName)

  if (number === null) return null

  if (!Number.isInteger(number) || number < min || number > max) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be an integer from ${min} to ${max}.`,
    })
  }

  return number
}

function cleanBoolean(
  value: unknown,
  fieldName: string,
  fallback: boolean,
): boolean {
  if (typeof value === 'undefined' || value === null) return fallback

  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a boolean.`,
    })
  }

  return value
}

function getFallbackFileType(body: CreateArtImagePayload): string {
  const source =
    cleanText(body.fileName, 'fileName', 255) ||
    cleanText(body.imagePath, 'imagePath', 2_000) ||
    cleanText(body.path, 'path', 2_000) ||
    ''
  const extension = source.split('?')[0]?.split('.').pop()?.toLowerCase()

  return extension && ALLOWED_FILE_TYPES.has(extension) ? extension : 'png'
}

function getFallbackFileName(body: CreateArtImagePayload, fileType: string): string {
  const source =
    cleanText(body.imagePath, 'imagePath', 2_000) ||
    cleanText(body.path, 'path', 2_000)

  if (source) {
    const fileName = source.split('?')[0]?.split('/').filter(Boolean).at(-1)
    if (fileName) return fileName.slice(0, 255)
  }

  return `art-image-${Date.now()}.${fileType}`
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<CreateArtImagePayload>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A JSON ArtImage body is required.',
      })
    }

    const unknownFields = Object.keys(body).filter(
      (field) => !ALLOWED_FIELDS.has(field),
    )

    if (unknownFields.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported ArtImage create fields: ${unknownFields.join(', ')}. Ownership and relationships are managed by authenticated resource APIs.`,
      })
    }

    const imageData = cleanText(
      body.imageData,
      'imageData',
      MAX_IMAGE_DATA_CHARS,
    )
    const imagePath = cleanText(body.imagePath, 'imagePath', 2_000)
    const sourcePath = cleanText(body.path, 'path', 2_000)

    if (!imageData && !imagePath && !sourcePath) {
      throw createError({
        statusCode: 400,
        message: 'imageData, imagePath, or path is required.',
      })
    }

    const requestedFileType = cleanText(body.fileType, 'fileType', 32)?.toLowerCase()
    const fileType = requestedFileType || getFallbackFileType(body)

    if (!ALLOWED_FILE_TYPES.has(fileType)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported fileType: ${fileType}.`,
      })
    }

    const fileName =
      cleanText(body.fileName, 'fileName', 255) ||
      getFallbackFileName(body, fileType)

    const data: Prisma.ArtImageCreateInput = {
      imageData,
      thumbnailData: cleanText(
        body.thumbnailData,
        'thumbnailData',
        MAX_THUMBNAIL_DATA_CHARS,
      ),
      fileName,
      fileType: fileType === 'jpg' ? 'jpeg' : fileType,
      imagePath,
      path: sourcePath,
      promptString: cleanText(body.promptString, 'promptString', 10_000),
      artPrompt: cleanText(body.artPrompt, 'artPrompt', 10_000),
      negativePrompt: cleanText(
        body.negativePrompt,
        'negativePrompt',
        10_000,
      ),
      checkpoint: cleanText(body.checkpoint, 'checkpoint', 255),
      sampler: cleanText(body.sampler, 'sampler', 255),
      seed: cleanNumber(body.seed, 'seed'),
      steps: cleanInteger(body.steps, 'steps', 1, 1_000),
      cfg: cleanNumber(body.cfg, 'cfg'),
      cfgHalf: cleanBoolean(body.cfgHalf, 'cfgHalf', false),
      designer:
        cleanText(body.designer, 'designer', 255) ||
        user.designer ||
        user.username ||
        `User ${user.id}`,
      genres: cleanText(body.genres, 'genres', 2_000),
      isPublic: cleanBoolean(body.isPublic, 'isPublic', false),
      isMature: cleanBoolean(body.isMature, 'isMature', false),
      isActive: cleanBoolean(body.isActive, 'isActive', true),
      serverName: cleanText(body.serverName, 'serverName', 255),
      serverUrl: cleanText(body.serverUrl, 'serverUrl', 2_000),
      User: {
        connect: { id: user.id },
      },
    }

    const artImage = await prisma.artImage.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'ArtImage created.',
      data: artImage,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create ArtImage.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
