// /server/api/server/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  Prisma,
  Server,
  ServerAccessMode,
  ServerStatus,
  ServerType,
} from '~/prisma/generated/prisma/client'

type ServerInput = Partial<Server>

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

function normalizeUrl(value?: string | null): string {
  if (!value || typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'The "baseUrl" field is required.',
    })
  }

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

function normalizePath(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  return trimmed.startsWith('/')
    ? trimmed.replace(/\/+$/, '')
    : `/${trimmed.replace(/\/+$/, '')}`
}

function normalizeOptionalString(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed || null
}

function validateEnumValue<T extends string>(
  value: string | undefined | null,
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

function resolveAccessDefaults(
  accessMode: ServerAccessMode,
  entry: ServerInput,
) {
  if (accessMode === 'TAILSCALE') {
    return {
      isPublic: false,
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      useOidc: false,
    }
  }

  if (accessMode === 'LOCAL') {
    return {
      isPublic: false,
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      useOidc: false,
    }
  }

  if (accessMode === 'PUBLIC_API_KEY') {
    return {
      isPublic: false,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: entry.allowBrowserRequests ?? false,
      useOidc: false,
    }
  }

  if (accessMode === 'PUBLIC_OIDC') {
    return {
      isPublic: false,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: entry.allowBrowserRequests ?? false,
      useOidc: true,
    }
  }

  if (accessMode === 'PUBLIC_PROTECTED') {
    return {
      isPublic: false,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: entry.allowBrowserRequests ?? true,
      useOidc: entry.useOidc ?? false,
    }
  }

  return {
    isPublic: false,
    isPrivateNetwork: false,
    requiresClientSideCheck: false,
    allowBrowserRequests: entry.allowBrowserRequests ?? true,
    useOidc: entry.useOidc ?? false,
  }
}

function validateUnsafePublicServer(entry: {
  accessMode: ServerAccessMode
  serverType: ServerType
  baseUrl: string
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

function buildCreateInput(
  entry: ServerInput,
  userId: number,
  isAdmin: boolean,
): Prisma.ServerCreateInput {
  if (!entry.title || typeof entry.title !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'The "title" field is required.',
    })
  }

  const title = entry.title.trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'The "title" field cannot be empty.',
    })
  }

  const baseUrl = normalizeUrl(entry.baseUrl)
  const endpointPath = normalizePath(entry.endpointPath)
  const healthPath = normalizePath(entry.healthPath)

  const serverType =
    validateEnumValue(
      entry.serverType as string | undefined,
      serverTypes,
      'serverType',
    ) || 'ART'

  const accessMode =
    validateEnumValue(
      entry.accessMode as string | undefined,
      serverAccessModes,
      'accessMode',
    ) || 'LOCAL'

  const lastStatus =
    validateEnumValue(
      entry.lastStatus as string | undefined,
      serverStatuses,
      'lastStatus',
    ) || 'UNKNOWN'

  const accessDefaults = resolveAccessDefaults(
    accessMode as ServerAccessMode,
    entry,
  )

  const requestedPublic = isAdmin ? (entry.isPublic ?? false) : false
  const isPublic =
    accessMode === 'TAILSCALE' || accessMode === 'LOCAL'
      ? false
      : requestedPublic

  const isPrivateNetwork =
    entry.isPrivateNetwork ?? accessDefaults.isPrivateNetwork

  validateUnsafePublicServer({
    accessMode: accessMode as ServerAccessMode,
    serverType: serverType as ServerType,
    baseUrl,
    isPublic,
    isPrivateNetwork,
  })

  return {
    title,
    label: normalizeOptionalString(entry.label),
    description: normalizeOptionalString(entry.description),
    category: normalizeOptionalString(entry.category),
    serverType: serverType as ServerType,
    baseUrl,
    endpointPath,
    healthPath,

    user: { connect: { id: userId } },

    accessMode: accessMode as ServerAccessMode,
    requiresClientSideCheck:
      entry.requiresClientSideCheck ?? accessDefaults.requiresClientSideCheck,
    isPrivateNetwork,
    allowBrowserRequests:
      entry.allowBrowserRequests ?? accessDefaults.allowBrowserRequests,

    isPublic,
    isOfficial: isAdmin ? (entry.isOfficial ?? false) : false,
    isDefault: isAdmin ? (entry.isDefault ?? false) : false,
    isActive: entry.isActive ?? true,
    isEditable: entry.isEditable ?? true,

    requiresApiKey: entry.requiresApiKey ?? accessMode === 'PUBLIC_API_KEY',
    apiKeyName: normalizeOptionalString(entry.apiKeyName),

    useOidc: entry.useOidc ?? accessDefaults.useOidc,
    oidcProvider:
      accessMode === 'PUBLIC_OIDC' || entry.useOidc
        ? normalizeOptionalString(entry.oidcProvider) || 'authelia'
        : normalizeOptionalString(entry.oidcProvider),

    supportsTxt2Img: entry.supportsTxt2Img ?? false,
    supportsImg2Img: entry.supportsImg2Img ?? false,
    supportsChat: entry.supportsChat ?? false,
    supportsComfyWorkflow: entry.supportsComfyWorkflow ?? false,
    supportsCheckpointOverride: entry.supportsCheckpointOverride ?? false,
    supportsSampler: entry.supportsSampler ?? false,
    supportsNegativePrompt: entry.supportsNegativePrompt ?? false,
    supportsSeed: entry.supportsSeed ?? false,
    supportsSteps: entry.supportsSteps ?? false,
    supportsVideo: entry.supportsVideo ?? false,

    apiLink: normalizeOptionalString(entry.apiLink),
    model: normalizeOptionalString(entry.model),
    designer: normalizeOptionalString(entry.designer),
    version: normalizeOptionalString(entry.version),
    notes: normalizeOptionalString(entry.notes),

    sortOrder: typeof entry.sortOrder === 'number' ? entry.sortOrder : 0,
    lastCheckedAt: entry.lastCheckedAt || null,
    lastStatus: lastStatus as ServerStatus,
  }
}

export default defineEventHandler(async (event) => {
  const singularLabel = 'Server'
  const pluralLabel = 'Servers'

  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ServerInput | ServerInput[]>(event)
    const userId = user.id
    const isAdmin = user.Role === 'ADMIN'

    if (Array.isArray(body)) {
      const created: Server[] = []
      const skipped: string[] = []

      for (const entry of body) {
        const data = buildCreateInput(entry, userId, isAdmin)

        try {
          const existing = await prisma.server.findFirst({
            where: {
              userId,
              title: data.title,
              baseUrl: data.baseUrl,
              endpointPath: data.endpointPath,
              accessMode: data.accessMode,
            },
          })

          if (existing) {
            skipped.push(data.title)
            continue
          }

          const result = await prisma.server.create({ data })
          created.push(result)
        } catch (error: any) {
          if (error?.code === 'P2002') {
            skipped.push(data.title)
          } else {
            throw error
          }
        }
      }

      event.node.res.statusCode = 201

      return {
        success: true,
        message: `${created.length} ${pluralLabel} created, ${skipped.length} skipped.`,
        data: created,
        skipped,
        count: created.length,
        statusCode: 201,
      }
    }

    const data = buildCreateInput(body, userId, isAdmin)

    const existing = await prisma.server.findFirst({
      where: {
        userId,
        title: data.title,
        baseUrl: data.baseUrl,
        endpointPath: data.endpointPath,
        accessMode: data.accessMode,
      },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        message:
          'A server with the same title, URL, endpoint, and access mode already exists for this user.',
      })
    }

    const created = await prisma.server.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: `${singularLabel} created successfully.`,
      data: created,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create Server.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
