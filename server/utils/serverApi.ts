// /server/utils/serverApi.ts
import { createError } from 'h3'
import type { H3Event } from 'h3'
import prisma from './prisma'
import {
  ServerAccessMode,
  ServerAuthType,
  ServerStatus,
  ServerType,
  type Server,
} from '~/prisma/generated/prisma/client'
import { getOptionalApiUser, requireApiUser } from './authGuard'
import type { AuthUser } from './authUser'

type ServerInput = Record<string, unknown>

const serverTypes = Object.values(ServerType)
const accessModes = Object.values(ServerAccessMode)
const authTypes = Object.values(ServerAuthType)
const serverStatuses = Object.values(ServerStatus)

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

function validateEnumField(
  input: ServerInput,
  field: string,
  allowedValues: readonly string[],
): void {
  const value = input[field]

  if (value === undefined || value === null) return

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${field}. Expected one of: ${allowedValues.join(', ')}.`,
    })
  }
}

export function validateServerEnums(input: ServerInput): void {
  validateEnumField(input, 'serverType', serverTypes)
  validateEnumField(input, 'accessMode', accessModes)
  validateEnumField(input, 'authType', authTypes)
  validateEnumField(input, 'lastStatus', serverStatuses)
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
  const auth = await getOptionalApiUser(event)
  return auth?.user ?? null
}

export async function requireAuthUser(event: H3Event): Promise<AuthUser> {
  const auth = await requireApiUser(event)
  return auth.user
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

export function assertServerCreateOwnership(
  input: ServerInput,
  authenticatedUserId: number,
): void {
  if (!Object.prototype.hasOwnProperty.call(input, 'userId')) return

  const requestedUserId = cleanInt(input.userId)

  if (requestedUserId !== authenticatedUserId) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported Server ownership assignment. Ownership is server-owned.',
    })
  }
}

export function assertServerOwnershipUnchanged(
  input: ServerInput,
  existingUserId: number | null,
): void {
  if (!Object.prototype.hasOwnProperty.call(input, 'userId')) return

  const requestedUserId = cleanInt(input.userId)

  if (!existingUserId || requestedUserId !== existingUserId) {
    throw createError({
      statusCode: 400,
      message: 'Unsupported Server ownership reassignment. Ownership is server-owned.',
    })
  }
}

export function buildServerCreateData(input: ServerInput, user: AuthUser) {
  assertServerCreateOwnership(input, user.id)

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

    userId: user.id,

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

// Record a health/uptime sample: append a ServerHealthCheck history row and
// refresh the point-in-time Server.lastStatus/lastCheckedAt. Shared by the
// relay heartbeat (/api/server/heartbeat) and the browser/server health checks
// (/api/server/health/[id]). Best-effort — callers treat failures as non-fatal.
export async function recordServerHealthCheck(input: {
  serverId: number
  ok: boolean
  status?: ServerStatus
  latencyMs?: number | null
  source?: string
  note?: string | null
  checkedAt?: Date
}): Promise<void> {
  const status: ServerStatus = input.status ?? (input.ok ? 'ONLINE' : 'OFFLINE')
  const checkedAt = input.checkedAt ?? new Date()

  await prisma.$transaction([
    prisma.serverHealthCheck.create({
      data: {
        serverId: input.serverId,
        checkedAt,
        status,
        ok: input.ok,
        latencyMs:
          typeof input.latencyMs === 'number'
            ? Math.round(input.latencyMs)
            : null,
        source: (input.source || 'server').slice(0, 32),
        note: input.note ?? null,
      },
    }),
    prisma.server.update({
      where: { id: input.serverId },
      data: { lastStatus: status, lastCheckedAt: checkedAt },
    }),
  ])
}
