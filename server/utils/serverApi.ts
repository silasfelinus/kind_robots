// /server/utils/serverApi.ts
import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import prisma from './prisma'
import type {
  Server,
  ServerAccessMode,
  ServerAuthType,
  ServerStatus,
  ServerType,
  User,
} from '~/prisma/generated/prisma/client'

export type AuthUser = User & {
  isAdmin: boolean
}

type ServerInput = Record<string, unknown>

const serverTypes: ServerType[] = [
  'A1111',
  'COMFY',
  'OPENAI',
  'ANTHROPIC',
  'CUSTOM',
]

const accessModes: ServerAccessMode[] = [
  'BROWSER',
  'BACKEND',
  'TAILSCALE',
  'PUBLIC',
  'LOCAL',
]

const authTypes: ServerAuthType[] = [
  'NONE',
  'BEARER',
  'HEADER',
  'QUERY',
  'API_KEY',
]

const serverStatuses: ServerStatus[] = [
  'ONLINE',
  'OFFLINE',
  'DEGRADED',
  'UNKNOWN',
]

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanOptionalText(value: unknown): string | null | undefined {
  if (typeof value === 'undefined') return undefined
  return cleanText(value)
}

function cleanBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function cleanInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) return parsed
  }
  return undefined
}

function cleanEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof value !== 'string') return undefined
  return allowed.includes(value as T) ? (value as T) : undefined
}

function getBearerToken(event: H3Event): string | null {
  const authorization = getHeader(event, 'authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice('Bearer '.length).trim() || null
}

function withAdminFlag(user: User): AuthUser {
  return {
    ...user,
    isAdmin: String(user.Role) === 'ADMIN',
  }
}

export function parseId(value: string | undefined): number {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid server ID.',
    })
  }

  return id
}

export async function getOptionalAuthUser(
  event: H3Event,
): Promise<AuthUser | null> {
  const token = getBearerToken(event)
  if (!token) return null

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ apiKey: token }, { token }],
      isActive: true,
    },
  })

  return user ? withAdminFlag(user) : null
}

export async function requireAuthUser(event: H3Event): Promise<AuthUser> {
  const user = await getOptionalAuthUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authorization token is required.',
    })
  }

  return user
}

export async function readServerById(id: number): Promise<Server> {
  const server = await prisma.server.findUnique({
    where: { id },
  })

  if (!server || !server.isActive) {
    throw createError({
      statusCode: 404,
      message: `Server ${id} was not found or is not available.`,
    })
  }

  return server
}

export function canReadServer(server: Server, user: AuthUser | null): boolean {
  if (!server.isActive) return false
  if (user?.isAdmin) return true
  if (server.isPublic || server.isOfficial || server.isDefault) return true
  return Boolean(user && server.userId === user.id)
}

export function canMutateServer(server: Server, user: AuthUser): boolean {
  if (!server.isActive) return false
  if (user.isAdmin) return true
  return Boolean(server.userId === user.id && !server.isOfficial)
}

export function canDeleteServer(server: Server, user: AuthUser): boolean {
  if (!server.isActive) return false
  if (user.isAdmin && !server.isDefault) return true

  return Boolean(
    server.userId === user.id &&
    !server.isPublic &&
    !server.isOfficial &&
    !server.isDefault,
  )
}

export function safeServer(server: Server, user?: AuthUser | null) {
  const canSeeSecrets = Boolean(
    user?.isAdmin || (user && server.userId === user.id),
  )

  return {
    ...server,
    apiKey: canSeeSecrets && server.apiKey ? '••••••••' : null,
    hasApiKey: Boolean(server.apiKey),
  }
}

export function safeServers(servers: Server[], user?: AuthUser | null) {
  return servers.map((server) => safeServer(server, user))
}

export function buildServerCreateData(input: ServerInput, user: AuthUser) {
  const title = cleanText(input.title)
  const baseUrl = cleanText(input.baseUrl)

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'Server title is required.',
    })
  }

  if (!baseUrl) {
    throw createError({
      statusCode: 400,
      message: 'Server baseUrl is required.',
    })
  }

  const serverType = cleanEnum(input.serverType, serverTypes) ?? 'CUSTOM'
  const accessMode = cleanEnum(input.accessMode, accessModes) ?? 'BROWSER'
  const authType = cleanEnum(input.authType, authTypes) ?? 'NONE'
  const lastStatus = cleanEnum(input.lastStatus, serverStatuses) ?? 'UNKNOWN'

  return {
    title,
    label: cleanText(input.label),
    description: cleanText(input.description),
    category: cleanText(input.category),

    serverType,
    accessMode,
    authType,

    baseUrl,
    endpointPath: cleanText(input.endpointPath),
    healthPath: cleanText(input.healthPath),
    apiLink: cleanText(input.apiLink),

    apiKey: cleanText(input.apiKey),
    apiKeyName: cleanText(input.apiKeyName),

    model: cleanText(input.model),
    notes: cleanText(input.notes),
    designer: cleanText(input.designer) || user.designerName || user.username,
    version: cleanText(input.version),
    sortOrder: cleanInt(input.sortOrder) ?? 0,

    userId:
      user.isAdmin && cleanInt(input.userId) ? cleanInt(input.userId) : user.id,

    isPublic: user.isAdmin ? Boolean(input.isPublic) : false,
    isOfficial: user.isAdmin ? Boolean(input.isOfficial) : false,
    isDefault: user.isAdmin ? Boolean(input.isDefault) : false,
    isActive: cleanBoolean(input.isActive) ?? true,
    isEditable: cleanBoolean(input.isEditable) ?? true,
    isMature: cleanBoolean(input.isMature) ?? false,

    lastStatus,
    artPrompt: cleanText(input.artPrompt),
  }
}

export function buildServerUpdateData(input: ServerInput, user: AuthUser) {
  const data: Record<string, unknown> = {}

  const textFields = [
    'title',
    'label',
    'description',
    'category',
    'baseUrl',
    'endpointPath',
    'healthPath',
    'apiLink',
    'apiKeyName',
    'model',
    'notes',
    'designer',
    'version',
    'artPrompt',
  ]

  for (const field of textFields) {
    if (field in input) {
      data[field] = cleanOptionalText(input[field])
    }
  }

  if ('serverType' in input) {
    data.serverType = cleanEnum(input.serverType, serverTypes) ?? 'CUSTOM'
  }

  if ('accessMode' in input) {
    data.accessMode = cleanEnum(input.accessMode, accessModes) ?? 'BROWSER'
  }

  if ('authType' in input) {
    data.authType = cleanEnum(input.authType, authTypes) ?? 'NONE'
  }

  if ('lastStatus' in input) {
    data.lastStatus = cleanEnum(input.lastStatus, serverStatuses) ?? 'UNKNOWN'
  }

  if ('sortOrder' in input) {
    data.sortOrder = cleanInt(input.sortOrder) ?? 0
  }

  const userEditableBooleanFields = ['isActive', 'isEditable', 'isMature']

  for (const field of userEditableBooleanFields) {
    if (field in input) {
      data[field] = Boolean(input[field])
    }
  }

  if (user.isAdmin) {
    const adminBooleanFields = ['isPublic', 'isOfficial', 'isDefault']

    for (const field of adminBooleanFields) {
      if (field in input) {
        data[field] = Boolean(input[field])
      }
    }

    if ('userId' in input) {
      data.userId = cleanInt(input.userId) ?? null
    }
  }

  return data
}

export function buildServerBaseUrl(server: Server): string {
  const baseUrl = server.baseUrl?.trim()

  if (!baseUrl) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" does not have a baseUrl.`,
    })
  }

  return baseUrl.replace(/\/+$/, '')
}

export function buildServerEndpointUrl(server: Server): string {
  const baseUrl = buildServerBaseUrl(server)
  const endpointPath = server.endpointPath?.trim()

  if (!endpointPath) return baseUrl

  return `${baseUrl}/${endpointPath.replace(/^\/+/, '')}`
}

export function buildServerHealthUrl(server: Server): string {
  const baseUrl = buildServerBaseUrl(server)
  const healthPath = server.healthPath?.trim()

  if (!healthPath) return baseUrl

  return `${baseUrl}/${healthPath.replace(/^\/+/, '')}`
}

export function buildServerAuthHeaders(server: Server): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
  }

  if (!server.apiKey) return headers

  if (server.authType === 'BEARER') {
    headers.Authorization = `Bearer ${server.apiKey}`
    return headers
  }

  if (server.authType === 'HEADER' || server.authType === 'API_KEY') {
    headers[server.apiKeyName || 'X-API-Key'] = server.apiKey
    return headers
  }

  return headers
}
