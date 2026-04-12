// /server/api/server/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  Prisma,
  ServerStatus,
  ServerType,
} from '~/prisma/generated/prisma/client'

function normalizeUrl(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value.trim())
    return url.origin + url.pathname.replace(/\/+$/, '')
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid baseUrl. Please enter a valid URL.',
    })
  }
}

function normalizePath(value?: string | null): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.startsWith('/')
    ? trimmed.replace(/\/+$/, '')
    : `/${trimmed.replace(/\/+$/, '')}`
}

function validateEnumValue<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  label: string,
): T | undefined {
  if (!value) return undefined
  if (!allowed.includes(value as T)) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${label}: "${value}".`,
    })
  }
  return value as T
}

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Server ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingServer = await prisma.server.findUnique({
      where: { id },
    })

    if (!existingServer) {
      throw createError({
        statusCode: 404,
        message: 'Server not found.',
      })
    }

    const isAdmin = user.Role === 'ADMIN'
    if (existingServer.userId !== user.id && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Server.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const serverTypes = [
      'ART',
      'TEXT',
      'COMFY',
      'A1111',
      'OPENAI_COMPATIBLE',
      'OTHER',
    ] as const

    const serverStatuses = ['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN'] as const

    const data: Prisma.ServerUpdateInput = {}

    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.label === 'string' || body.label === null)
      data.label = body.label as string | null
    if (typeof body.description === 'string' || body.description === null)
      data.description = body.description as string | null
    if (typeof body.category === 'string' || body.category === null)
      data.category = body.category as string | null

    if (typeof body.baseUrl === 'string')
      data.baseUrl = normalizeUrl(body.baseUrl)
    if (body.endpointPath !== undefined)
      data.endpointPath = normalizePath(body.endpointPath as string | null)
    if (body.healthPath !== undefined)
      data.healthPath = normalizePath(body.healthPath as string | null)

    if (body.serverType !== undefined) {
      data.serverType = validateEnumValue(
        body.serverType as string,
        serverTypes,
        'serverType',
      ) as ServerType
    }

    if (body.lastStatus !== undefined) {
      data.lastStatus = validateEnumValue(
        body.lastStatus as string,
        serverStatuses,
        'lastStatus',
      ) as ServerStatus
    }

    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.requiresApiKey === 'boolean')
      data.requiresApiKey = body.requiresApiKey
    if (typeof body.apiKeyName === 'string' || body.apiKeyName === null)
      data.apiKeyName = body.apiKeyName as string | null

    if (typeof body.supportsTxt2Img === 'boolean')
      data.supportsTxt2Img = body.supportsTxt2Img
    if (typeof body.supportsImg2Img === 'boolean')
      data.supportsImg2Img = body.supportsImg2Img
    if (typeof body.supportsChat === 'boolean')
      data.supportsChat = body.supportsChat
    if (typeof body.supportsComfyWorkflow === 'boolean')
      data.supportsComfyWorkflow = body.supportsComfyWorkflow
    if (typeof body.supportsCheckpointOverride === 'boolean')
      data.supportsCheckpointOverride = body.supportsCheckpointOverride
    if (typeof body.supportsSampler === 'boolean')
      data.supportsSampler = body.supportsSampler
    if (typeof body.supportsNegativePrompt === 'boolean')
      data.supportsNegativePrompt = body.supportsNegativePrompt
    if (typeof body.supportsSeed === 'boolean')
      data.supportsSeed = body.supportsSeed
    if (typeof body.supportsSteps === 'boolean')
      data.supportsSteps = body.supportsSteps

    if (typeof body.designer === 'string' || body.designer === null)
      data.designer = body.designer as string | null
    if (typeof body.version === 'string' || body.version === null)
      data.version = body.version as string | null
    if (typeof body.notes === 'string' || body.notes === null)
      data.notes = body.notes as string | null
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder
    if (
      body.lastCheckedAt instanceof Date ||
      typeof body.lastCheckedAt === 'string' ||
      body.lastCheckedAt === null
    ) {
      data.lastCheckedAt = body.lastCheckedAt
        ? new Date(body.lastCheckedAt as string)
        : null
    }

    if (isAdmin) {
      if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic
      if (typeof body.isOfficial === 'boolean')
        data.isOfficial = body.isOfficial
      if (typeof body.isDefault === 'boolean') data.isDefault = body.isDefault
    }

    if ('title' in data && (!data.title || !String(data.title).trim())) {
      throw createError({
        statusCode: 400,
        message: 'The "title" field cannot be empty.',
      })
    }

    const updated = await prisma.server.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Server updated successfully.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || `Failed to update Server with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
