// /server/api/server/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  Prisma,
  ServerAccessMode,
  ServerStatus,
  ServerType,
} from '~/prisma/generated/prisma/client'

const serverTypes = [
  'ART',
  'TEXT',
  'COMFY',
  'A1111',
  'OPENAI_COMPATIBLE',
  'OTHER',
] as const

const serverStatuses = ['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN'] as const

const serverAccessModes = [
  'LOCAL',
  'TAILSCALE',
  'PUBLIC_PROTECTED',
  'PUBLIC_API_KEY',
  'PUBLIC_OIDC',
  'PUBLIC_UNPROTECTED',
] as const

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

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()

  return trimmed || null
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

function getAccessModeDefaults(accessMode: ServerAccessMode) {
  if (accessMode === 'TAILSCALE') {
    return {
      isPublic: false,
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      useOidc: false,
      requiresApiKey: false,
      oidcProvider: null as string | null,
    }
  }

  if (accessMode === 'LOCAL') {
    return {
      isPublic: false,
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      useOidc: false,
      requiresApiKey: false,
      oidcProvider: null as string | null,
    }
  }

  if (accessMode === 'PUBLIC_API_KEY') {
    return {
      isPublic: false,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      useOidc: false,
      requiresApiKey: true,
      oidcProvider: null as string | null,
    }
  }

  if (accessMode === 'PUBLIC_OIDC') {
    return {
      isPublic: false,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      useOidc: true,
      requiresApiKey: false,
      oidcProvider: 'authelia',
    }
  }

  if (accessMode === 'PUBLIC_PROTECTED') {
    return {
      isPublic: false,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      useOidc: false,
      requiresApiKey: false,
      oidcProvider: null as string | null,
    }
  }

  return {
    isPublic: false,
    isPrivateNetwork: false,
    requiresClientSideCheck: false,
    allowBrowserRequests: true,
    useOidc: false,
    requiresApiKey: false,
    oidcProvider: null as string | null,
  }
}

function boolFromBody(
  body: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  return typeof body[key] === 'boolean' ? Boolean(body[key]) : fallback
}

function validateUnsafePublicServer(entry: {
  accessMode: ServerAccessMode
  serverType: ServerType
  isPublic: boolean
  isPrivateNetwork: boolean
}) {
  if (
    entry.accessMode !== 'PUBLIC_UNPROTECTED' ||
    !entry.isPublic ||
    entry.isPrivateNetwork
  ) {
    return
  }

  const riskyServerTypes: ServerType[] = ['COMFY', 'A1111', 'ART']

  if (riskyServerTypes.includes(entry.serverType)) {
    throw createError({
      statusCode: 400,
      message:
        'Public unprotected image servers are not allowed. Use Tailscale, a protected public URL, an API key, or OIDC.',
    })
  }
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

    const data: Prisma.ServerUpdateInput = {}

    if (typeof body.title === 'string') data.title = body.title.trim()
    if (body.label !== undefined)
      data.label = normalizeOptionalString(body.label)
    if (body.description !== undefined)
      data.description = normalizeOptionalString(body.description)
    if (body.category !== undefined)
      data.category = normalizeOptionalString(body.category)

    if (typeof body.baseUrl === 'string') {
      data.baseUrl = normalizeUrl(body.baseUrl)
    }

    if (body.endpointPath !== undefined) {
      data.endpointPath = normalizePath(body.endpointPath as string | null)
    }

    if (body.healthPath !== undefined) {
      data.healthPath = normalizePath(body.healthPath as string | null)
    }

    if (body.serverType !== undefined) {
      data.serverType = validateEnumValue(
        body.serverType as string,
        serverTypes,
        'serverType',
      ) as ServerType
    }

    if (body.accessMode !== undefined) {
      const accessMode = validateEnumValue(
        body.accessMode as string,
        serverAccessModes,
        'accessMode',
      ) as ServerAccessMode

      const defaults = getAccessModeDefaults(accessMode)

      data.accessMode = accessMode
      data.isPrivateNetwork = boolFromBody(
        body,
        'isPrivateNetwork',
        defaults.isPrivateNetwork,
      )
      data.requiresClientSideCheck = boolFromBody(
        body,
        'requiresClientSideCheck',
        defaults.requiresClientSideCheck,
      )
      data.allowBrowserRequests = boolFromBody(
        body,
        'allowBrowserRequests',
        defaults.allowBrowserRequests,
      )
      data.useOidc = boolFromBody(body, 'useOidc', defaults.useOidc)
      data.requiresApiKey = boolFromBody(
        body,
        'requiresApiKey',
        defaults.requiresApiKey,
      )

      if (body.oidcProvider !== undefined) {
        data.oidcProvider = normalizeOptionalString(body.oidcProvider)
      } else if (accessMode === 'PUBLIC_OIDC') {
        data.oidcProvider = existingServer.oidcProvider || defaults.oidcProvider
      } else {
        data.oidcProvider = defaults.oidcProvider
      }

      if (isAdmin) {
        data.isPublic =
          typeof body.isPublic === 'boolean' ? body.isPublic : defaults.isPublic
      } else {
        data.isPublic = false
      }
    } else {
      if (typeof body.requiresClientSideCheck === 'boolean') {
        data.requiresClientSideCheck = body.requiresClientSideCheck
      }

      if (typeof body.isPrivateNetwork === 'boolean') {
        data.isPrivateNetwork = body.isPrivateNetwork
      }

      if (typeof body.allowBrowserRequests === 'boolean') {
        data.allowBrowserRequests = body.allowBrowserRequests
      }

      if (typeof body.useOidc === 'boolean') {
        data.useOidc = body.useOidc
      }

      if (body.oidcProvider !== undefined) {
        data.oidcProvider = normalizeOptionalString(body.oidcProvider)
      }

      if (typeof body.requiresApiKey === 'boolean') {
        data.requiresApiKey = body.requiresApiKey
      }
    }

    if (body.lastStatus !== undefined) {
      data.lastStatus = validateEnumValue(
        body.lastStatus as string,
        serverStatuses,
        'lastStatus',
      ) as ServerStatus
    }

    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.isEditable === 'boolean') data.isEditable = body.isEditable

    if (body.apiKeyName !== undefined) {
      data.apiKeyName = normalizeOptionalString(body.apiKeyName)
    }

    if (typeof body.supportsTxt2Img === 'boolean') {
      data.supportsTxt2Img = body.supportsTxt2Img
    }

    if (typeof body.supportsImg2Img === 'boolean') {
      data.supportsImg2Img = body.supportsImg2Img
    }

    if (typeof body.supportsChat === 'boolean') {
      data.supportsChat = body.supportsChat
    }

    if (typeof body.supportsComfyWorkflow === 'boolean') {
      data.supportsComfyWorkflow = body.supportsComfyWorkflow
    }

    if (typeof body.supportsCheckpointOverride === 'boolean') {
      data.supportsCheckpointOverride = body.supportsCheckpointOverride
    }

    if (typeof body.supportsSampler === 'boolean') {
      data.supportsSampler = body.supportsSampler
    }

    if (typeof body.supportsNegativePrompt === 'boolean') {
      data.supportsNegativePrompt = body.supportsNegativePrompt
    }

    if (typeof body.supportsSeed === 'boolean') {
      data.supportsSeed = body.supportsSeed
    }

    if (typeof body.supportsSteps === 'boolean') {
      data.supportsSteps = body.supportsSteps
    }

    if (typeof body.supportsVideo === 'boolean') {
      data.supportsVideo = body.supportsVideo
    }

    if (body.apiLink !== undefined) {
      data.apiLink = normalizeOptionalString(body.apiLink)
    }

    if (body.model !== undefined) {
      data.model = normalizeOptionalString(body.model)
    }

    if (body.designer !== undefined) {
      data.designer = normalizeOptionalString(body.designer)
    }

    if (body.version !== undefined) {
      data.version = normalizeOptionalString(body.version)
    }

    if (body.notes !== undefined) {
      data.notes = normalizeOptionalString(body.notes)
    }

    if (typeof body.sortOrder === 'number') {
      data.sortOrder = body.sortOrder
    }

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

    const nextAccessMode =
      (data.accessMode as ServerAccessMode | undefined) ||
      existingServer.accessMode

    const nextServerType =
      (data.serverType as ServerType | undefined) || existingServer.serverType

    const nextIsPublic =
      typeof data.isPublic === 'boolean'
        ? data.isPublic
        : existingServer.isPublic

    const nextIsPrivateNetwork =
      typeof data.isPrivateNetwork === 'boolean'
        ? data.isPrivateNetwork
        : existingServer.isPrivateNetwork

    validateUnsafePublicServer({
      accessMode: nextAccessMode,
      serverType: nextServerType,
      isPublic: nextIsPublic,
      isPrivateNetwork: nextIsPrivateNetwork,
    })

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
