import { createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { normalizeSlugInput } from '~/utils/slugify'
import {
  ResourceType,
  SupportedServer,
  type Prisma,
  type Resource,
} from '~/prisma/generated/prisma/client'

export type ResourceCreateBody = Partial<Resource> & {
  connectServerIds?: number[]
  serverIds?: number[]
  connectLoraImageIds?: number[]
  usedInImageIds?: number[]
}

export type ResourceBatchSkip = {
  name: string
  reason: string
}

export type ResourceBatchFailure = {
  name: string
  message: string
}

const resourceTypes = Object.values(ResourceType)
const supportedServers = Object.values(SupportedServer)

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  ]
}

function normalizeEnum<T extends string>(options: {
  value: unknown
  values: readonly T[]
  fallback: T
  field: string
}): T {
  const { value, values, fallback, field } = options

  if (value === undefined || value === null || value === '') return fallback

  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${field}. Expected one of: ${values.join(', ')}.`,
    })
  }

  return value as T
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required.`,
    })
  }

  const text = value.trim()

  if (text.length > 191) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be 191 characters or fewer.`,
    })
  }

  return text
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function optionalPositiveId(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `${field} must be a positive integer when provided.`,
    })
  }

  return id
}

async function assertRelatedRecordsExist(options: {
  userId: number
  artImageId?: number
  serverIds: number[]
  loraImageIds: number[]
}): Promise<void> {
  const [user, artImage, servers, loraImages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: options.userId },
      select: { id: true },
    }),
    options.artImageId
      ? prisma.artImage.findUnique({
          where: { id: options.artImageId },
          select: { id: true },
        })
      : null,
    options.serverIds.length
      ? prisma.server.findMany({
          where: { id: { in: options.serverIds } },
          select: { id: true },
        })
      : [],
    options.loraImageIds.length
      ? prisma.artImage.findMany({
          where: { id: { in: options.loraImageIds } },
          select: { id: true },
        })
      : [],
  ])

  if (!user) {
    throw createError({
      statusCode: 404,
      message: `User ID not found: ${options.userId}.`,
    })
  }

  if (options.artImageId && !artImage) {
    throw createError({
      statusCode: 404,
      message: `ArtImage ID not found: ${options.artImageId}.`,
    })
  }

  const foundServerIds = new Set(servers.map((server) => server.id))
  const missingServerIds = options.serverIds.filter(
    (serverId) => !foundServerIds.has(serverId),
  )

  if (missingServerIds.length) {
    throw createError({
      statusCode: 404,
      message: `Server IDs not found: ${missingServerIds.join(', ')}.`,
    })
  }

  const foundImageIds = new Set(loraImages.map((image) => image.id))
  const missingImageIds = options.loraImageIds.filter(
    (imageId) => !foundImageIds.has(imageId),
  )

  if (missingImageIds.length) {
    throw createError({
      statusCode: 404,
      message: `LoRA ArtImage IDs not found: ${missingImageIds.join(', ')}.`,
    })
  }
}

export function fallbackResourceName(entry: ResourceCreateBody): string {
  return typeof entry?.name === 'string' && entry.name.trim()
    ? entry.name.trim()
    : 'Untitled resource'
}

export function isResourceDuplicateError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002',
  )
}

export function isResourceInfrastructureError(error: unknown): boolean {
  return Number(errorHandler(error).statusCode) >= 500
}

export async function buildResourceCreateInput(options: {
  entry: ResourceCreateBody
  fallbackUserId: number
  canAssignUserId: boolean
}): Promise<Prisma.ResourceCreateInput> {
  const { entry, fallbackUserId, canAssignUserId } = options
  const name = requiredText(entry.name, 'name')
  const requestedUserId = optionalPositiveId(entry.userId, 'userId')
  const userId =
    canAssignUserId && requestedUserId ? requestedUserId : fallbackUserId
  const artImageId = optionalPositiveId(entry.artImageId, 'artImageId')
  const serverIds = normalizeIdArray(entry.connectServerIds ?? entry.serverIds)
  const loraImageIds = normalizeIdArray(
    entry.connectLoraImageIds ?? entry.usedInImageIds,
  )

  await assertRelatedRecordsExist({
    userId,
    artImageId,
    serverIds,
    loraImageIds,
  })

  return {
    name,
    slug: normalizeSlugInput(entry.slug) ?? undefined,
    customLabel: nullableText(entry.customLabel),
    MediaPath: nullableText(entry.MediaPath),
    customUrl: nullableText(entry.customUrl),
    civitaiUrl: nullableText(entry.civitaiUrl),
    huggingUrl: nullableText(entry.huggingUrl),
    localPath: nullableText(entry.localPath),
    imagePath: nullableText(entry.imagePath),
    description: nullableText(entry.description),
    generation: nullableText(entry.generation),
    artPrompt: nullableText(entry.artPrompt),
    isMature: booleanValue(entry.isMature, false),
    isPublic: booleanValue(entry.isPublic, false),
    isActive: booleanValue(entry.isActive, true),
    resourceType: normalizeEnum({
      value: entry.resourceType,
      values: resourceTypes,
      fallback: ResourceType.EMBEDDING,
      field: 'resourceType',
    }),
    supportedServer: normalizeEnum({
      value: entry.supportedServer,
      values: supportedServers,
      fallback: SupportedServer.SDXL,
      field: 'supportedServer',
    }),
    User: { connect: { id: userId } },
    ArtImage: artImageId ? { connect: { id: artImageId } } : undefined,
    Servers: serverIds.length
      ? { connect: serverIds.map((id) => ({ id })) }
      : undefined,
    UsedInImages: loraImageIds.length
      ? { connect: loraImageIds.map((id) => ({ id })) }
      : undefined,
  }
}
