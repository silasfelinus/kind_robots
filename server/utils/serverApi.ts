// /server/api/utils/serverApi.ts
import { createError, type H3Event } from 'h3'
import {
  Prisma,
  type Server,
  type ServerAccessMode,
  type ServerGenerationEngine,
  type ServerStatus,
  type ServerTransport,
  type ServerType,
} from '~/prisma/generated/prisma/client'
import prisma from './prisma'

type ServerBody = Record<string, unknown>

const serverTypes: ServerType[] = [
  'TEXT',
  'OPENAI_COMPATIBLE',
  'ART',
  'COMFY',
  'A1111',
  'OTHER',
]

const generationEngines: ServerGenerationEngine[] = [
  'A1111',
  'COMFY',
  'FLUX',
  'KONTEXT',
  'OPENAI_IMAGE',
  'OTHER',
]

const serverTransports: ServerTransport[] = ['BROWSER', 'BACKEND']

const accessModes: ServerAccessMode[] = [
  'LOCAL',
  'TAILSCALE',
  'PUBLIC_PROTECTED',
  'PUBLIC_API_KEY',
  'PUBLIC_OIDC',
  'PUBLIC_UNPROTECTED',
]

const serverStatuses: ServerStatus[] = ['ONLINE', 'OFFLINE', 'UNKNOWN']

export type SafeServer = Omit<Server, 'apiKey'> & {
  apiKey?: string | null
}

type AuthUser = {
  id: number
  username?: string | null
  Role?: string | null
  isAdmin: boolean
}

export async function getOptionalAuthUser(
  event: H3Event,
): Promise<AuthUser | null> {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) return null

  const token = authorizationHeader.split(' ')[1] ?? ''

  if (!token) return null

  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    select: {
      id: true,
      username: true,
      Role: true,
    },
  })

  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    Role: user.Role,
    isAdmin: user.Role === 'ADMIN',
  }
}

export async function requireAuthUser(event: H3Event): Promise<AuthUser> {
  const user = await getOptionalAuthUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authorization token required in the format "Bearer <token>".',
    })
  }

  return user
}

export function canReadServer(server: Server, user: AuthUser | null): boolean {
  if (server.isPublic || server.isOfficial || server.isDefault) return true
  if (!user) return false
  if (user.isAdmin) return true
  return server.userId === user.id
}

export function canMutateServer(server: Server, user: AuthUser): boolean {
  if (user.isAdmin) return true
  return server.userId === user.id
}

export function canDeleteServer(server: Server, user: AuthUser): boolean {
  if (user.isAdmin) return true

  return (
    server.userId === user.id &&
    !server.isOfficial &&
    !server.isDefault &&
    !server.isPublic
  )
}

export function safeServer(server: Server, user: AuthUser | null): SafeServer {
  const canSeeKey = Boolean(user && (user.isAdmin || server.userId === user.id))

  return {
    ...server,
    apiKey: canSeeKey ? server.apiKey : server.apiKey ? '__stored__' : null,
  }
}

export function safeServers(
  servers: Server[],
  user: AuthUser | null,
): SafeServer[] {
  return servers.map((server) => safeServer(server, user))
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function asNullableString(value: unknown): string | null {
  const text = asString(value)
  return text ? text : null
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  return fallback
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function asJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!value) return Prisma.JsonNull

  if (typeof value === 'string') {
    const text = value.trim()

    if (!text) return Prisma.JsonNull

    try {
      return JSON.parse(text) as Prisma.InputJsonValue
    } catch {
      return Prisma.JsonNull
    }
  }

  if (typeof value === 'object') {
    return value as Prisma.InputJsonValue
  }

  return Prisma.JsonNull
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function optionalEnum<T extends string>(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
  allowed: readonly T[],
): void {
  if (!(key in body)) return

  const value = body[key]

  if (allowed.includes(value as T)) {
    ;(data as Record<string, unknown>)[key] = value
  }
}

function optionalString(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
): void {
  if (!(key in body)) return
  ;(data as Record<string, unknown>)[key] = asNullableString(body[key])
}

function optionalRequiredString(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
): void {
  if (!(key in body)) return

  const value = asString(body[key])

  if (value) {
    ;(data as Record<string, unknown>)[key] = value
  }
}

function optionalBoolean(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
): void {
  if (!(key in body)) return
  ;(data as Record<string, unknown>)[key] = Boolean(body[key])
}

function optionalNumber(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
): void {
  if (!(key in body)) return
  ;(data as Record<string, unknown>)[key] = asNumber(body[key], 0)
}

function optionalNullableNumber(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
): void {
  if (!(key in body)) return
  ;(data as Record<string, unknown>)[key] = asNullableNumber(body[key])
}

function optionalJson(
  data: Prisma.ServerUpdateInput,
  body: ServerBody,
  key: string,
): void {
  if (!(key in body)) return
  ;(data as Record<string, unknown>)[key] = asJson(body[key])
}

export function buildServerCreateData(
  body: ServerBody,
  user: AuthUser,
): Prisma.ServerUncheckedCreateInput {
  const title =
    asString(body.title) ||
    asString(body.label) ||
    `${asString(body.serverType, 'Server')} Server`

  const serverType = asEnum(body.serverType, serverTypes, 'TEXT')
  const generationEngine = asEnum(
    body.generationEngine,
    generationEngines,
    serverType === 'COMFY'
      ? 'COMFY'
      : serverType === 'A1111'
        ? 'A1111'
        : 'OTHER',
  )

  const defaultTransport = asEnum(
    body.defaultTransport,
    serverTransports,
    'BROWSER',
  )

  const accessMode = asEnum(body.accessMode, accessModes, 'LOCAL')

  return {
    title,
    label: asNullableString(body.label) || title,
    description: asNullableString(body.description),
    category: asNullableString(body.category),

    serverType,
    generationEngine,
    defaultTransport,

    baseUrl: asString(body.baseUrl),
    browserBaseUrl: asNullableString(body.browserBaseUrl),
    backendBaseUrl: asNullableString(body.backendBaseUrl),
    endpointPath: asNullableString(body.endpointPath),
    healthPath: asNullableString(body.healthPath),

    workflowPath: asNullableString(body.workflowPath),
    workflowJson: asJson(body.workflowJson),
    workflowVersion: asNullableString(body.workflowVersion),

    userId: typeof body.userId === 'number' ? body.userId : user.id,

    isPublic: asBoolean(body.isPublic, false),
    isOfficial: user.isAdmin ? asBoolean(body.isOfficial, false) : false,
    isDefault: user.isAdmin ? asBoolean(body.isDefault, false) : false,
    isActive: asBoolean(body.isActive, true),
    isEditable: asBoolean(body.isEditable, true),

    accessMode,
    requiresClientSideCheck: asBoolean(body.requiresClientSideCheck, true),
    isPrivateNetwork: asBoolean(body.isPrivateNetwork, true),
    allowBrowserRequests: asBoolean(body.allowBrowserRequests, true),

    requiresApiKey: asBoolean(body.requiresApiKey, false),
    apiKeyName: asNullableString(body.apiKeyName),
    apiKey: asNullableString(body.apiKey),

    useOidc: asBoolean(body.useOidc, false),
    oidcProvider: asNullableString(body.oidcProvider),

    supportsTxt2Img: asBoolean(body.supportsTxt2Img, false),
    supportsImg2Img: asBoolean(body.supportsImg2Img, false),
    supportsImageEdit: asBoolean(body.supportsImageEdit, false),
    supportsInpaint: asBoolean(body.supportsInpaint, false),
    supportsOutpaint: asBoolean(body.supportsOutpaint, false),
    supportsChat: asBoolean(body.supportsChat, false),
    supportsComfyWorkflow: asBoolean(body.supportsComfyWorkflow, false),
    supportsWorkflowUpload: asBoolean(body.supportsWorkflowUpload, false),
    supportsFlux: asBoolean(body.supportsFlux, false),
    supportsKontext: asBoolean(body.supportsKontext, false),
    supportsCheckpointOverride: asBoolean(
      body.supportsCheckpointOverride,
      false,
    ),
    supportsSampler: asBoolean(body.supportsSampler, false),
    supportsNegativePrompt: asBoolean(body.supportsNegativePrompt, false),
    supportsSeed: asBoolean(body.supportsSeed, false),
    supportsSteps: asBoolean(body.supportsSteps, false),
    supportsBatch: asBoolean(body.supportsBatch, false),
    supportsVideo: asBoolean(body.supportsVideo, false),

    defaultWidth: asNumber(body.defaultWidth, 512),
    defaultHeight: asNumber(body.defaultHeight, 512),
    defaultSteps: asNullableNumber(body.defaultSteps),
    defaultCfg: asNullableNumber(body.defaultCfg),
    defaultSampler: asNullableString(body.defaultSampler),
    defaultScheduler: asNullableString(body.defaultScheduler),

    apiLink: asNullableString(body.apiLink),
    model: asNullableString(body.model),
    designer: asNullableString(body.designer),
    version: asNullableString(body.version),
    notes: asNullableString(body.notes),
    sortOrder: asNumber(body.sortOrder, 0),
    lastStatus: asEnum(body.lastStatus, serverStatuses, 'UNKNOWN'),
  }
}

export function buildServerUpdateData(
  body: ServerBody,
  user: AuthUser,
): Prisma.ServerUpdateInput {
  const data: Prisma.ServerUpdateInput = {}

  optionalRequiredString(data, body, 'title')
  optionalString(data, body, 'label')
  optionalString(data, body, 'description')
  optionalString(data, body, 'category')

  optionalEnum(data, body, 'serverType', serverTypes)
  optionalEnum(data, body, 'generationEngine', generationEngines)
  optionalEnum(data, body, 'defaultTransport', serverTransports)

  optionalRequiredString(data, body, 'baseUrl')
  optionalString(data, body, 'browserBaseUrl')
  optionalString(data, body, 'backendBaseUrl')
  optionalString(data, body, 'endpointPath')
  optionalString(data, body, 'healthPath')

  optionalString(data, body, 'workflowPath')
  optionalJson(data, body, 'workflowJson')
  optionalString(data, body, 'workflowVersion')

  optionalBoolean(data, body, 'isPublic')
  optionalBoolean(data, body, 'isActive')
  optionalBoolean(data, body, 'isEditable')

  if (user.isAdmin) {
    optionalBoolean(data, body, 'isOfficial')
    optionalBoolean(data, body, 'isDefault')
  }

  optionalEnum(data, body, 'accessMode', accessModes)
  optionalBoolean(data, body, 'requiresClientSideCheck')
  optionalBoolean(data, body, 'isPrivateNetwork')
  optionalBoolean(data, body, 'allowBrowserRequests')

  optionalBoolean(data, body, 'requiresApiKey')
  optionalString(data, body, 'apiKeyName')

  optionalBoolean(data, body, 'useOidc')
  optionalString(data, body, 'oidcProvider')

  optionalBoolean(data, body, 'supportsTxt2Img')
  optionalBoolean(data, body, 'supportsImg2Img')
  optionalBoolean(data, body, 'supportsImageEdit')
  optionalBoolean(data, body, 'supportsInpaint')
  optionalBoolean(data, body, 'supportsOutpaint')
  optionalBoolean(data, body, 'supportsChat')
  optionalBoolean(data, body, 'supportsComfyWorkflow')
  optionalBoolean(data, body, 'supportsWorkflowUpload')
  optionalBoolean(data, body, 'supportsFlux')
  optionalBoolean(data, body, 'supportsKontext')
  optionalBoolean(data, body, 'supportsCheckpointOverride')
  optionalBoolean(data, body, 'supportsSampler')
  optionalBoolean(data, body, 'supportsNegativePrompt')
  optionalBoolean(data, body, 'supportsSeed')
  optionalBoolean(data, body, 'supportsSteps')
  optionalBoolean(data, body, 'supportsBatch')
  optionalBoolean(data, body, 'supportsVideo')

  optionalNumber(data, body, 'defaultWidth')
  optionalNumber(data, body, 'defaultHeight')
  optionalNullableNumber(data, body, 'defaultSteps')
  optionalNullableNumber(data, body, 'defaultCfg')
  optionalString(data, body, 'defaultSampler')
  optionalString(data, body, 'defaultScheduler')

  optionalString(data, body, 'apiLink')
  optionalString(data, body, 'model')
  optionalString(data, body, 'designer')
  optionalString(data, body, 'version')
  optionalString(data, body, 'notes')
  optionalNumber(data, body, 'sortOrder')
  optionalEnum(data, body, 'lastStatus', serverStatuses)

  return data
}

export function buildServerHealthUrl(server: Server, transport = 'backend') {
  const base =
    transport === 'browser'
      ? server.browserBaseUrl || server.baseUrl
      : server.backendBaseUrl || server.baseUrl

  const cleanBase = String(base || '').replace(/\/+$/, '')
  const healthPath = String(server.healthPath || '/').startsWith('/')
    ? String(server.healthPath || '/')
    : `/${String(server.healthPath || '/')}`

  return `${cleanBase}${healthPath}`
}

export async function readServerById(id: number): Promise<Server> {
  const server = await prisma.server.findUnique({
    where: { id },
  })

  if (!server) {
    throw createError({
      statusCode: 404,
      message: `Server #${id} was not found.`,
    })
  }

  return server
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
