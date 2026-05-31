// /server/utils/serverResolver.ts
import type {
  Prisma,
  Server,
  ServerType,
} from '~/prisma/generated/prisma/client'
import prisma from './prisma'

type ResolveServerCapability = 'art' | 'text' | 'chat' | 'comfy'
export type ServerEndpointTransport = 'browser' | 'backend'

interface ResolveServerInput {
  userId?: number | null
  serverId?: number | null
  serverName?: string | null
  capability?: ResolveServerCapability
}

function getServerBaseUrl(server: Server): string {
  return String(server.baseUrl || '').trim()
}

function joinUrl(baseUrl: string, path?: string | null): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '')
  const cleanPath = path?.trim().replace(/^\/+/, '') ?? ''

  if (!cleanBase) {
    throw new Error('Server is missing baseUrl.')
  }

  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase
}

function normalizeA1111Endpoint(server: Server): string {
  const endpoint = joinUrl(getServerBaseUrl(server), server.endpointPath)

  if (endpoint.endsWith('/sdapi/v1/txt2img')) {
    return endpoint
  }

  if (endpoint.endsWith('/sdapi/v1')) {
    return `${endpoint}/txt2img`
  }

  if (endpoint.endsWith('/sdapi')) {
    return `${endpoint}/v1/txt2img`
  }

  return `${endpoint}/sdapi/v1/txt2img`
}

function normalizeComfyEndpoint(server: Server): string {
  const endpoint = joinUrl(getServerBaseUrl(server), server.endpointPath)

  if (endpoint.endsWith('/prompt')) {
    return endpoint
  }

  return `${endpoint}/prompt`
}

export function getServerEndpoint(
  server: Server,
  _transport: ServerEndpointTransport = 'backend',
): string {
  if (server.serverType === 'A1111') {
    return normalizeA1111Endpoint(server)
  }

  if (server.serverType === 'COMFY') {
    return normalizeComfyEndpoint(server)
  }

  return joinUrl(getServerBaseUrl(server), server.endpointPath)
}

export function getServerHealthEndpoint(
  server: Server,
  _transport: ServerEndpointTransport = 'backend',
): string {
  const baseUrl = getServerBaseUrl(server)

  if (server.healthPath) {
    return joinUrl(baseUrl, server.healthPath)
  }

  if (server.serverType === 'A1111') {
    return joinUrl(baseUrl, '/sdapi/v1/progress')
  }

  if (server.serverType === 'COMFY') {
    return joinUrl(baseUrl, '/system_stats')
  }

  return joinUrl(baseUrl, server.endpointPath)
}

function capabilityWhere(
  capability?: ResolveServerCapability,
): Prisma.ServerWhereInput {
  if (capability === 'art') {
    return {
      serverType: {
        in: ['A1111', 'COMFY', 'OPENAI'] as ServerType[],
      },
    }
  }

  if (capability === 'comfy') {
    return {
      serverType: 'COMFY' as ServerType,
    }
  }

  if (capability === 'chat' || capability === 'text') {
    return {
      serverType: {
        in: ['OPENAI', 'ANTHROPIC', 'CUSTOM'] as ServerType[],
      },
    }
  }

  return {}
}

function visibilityWhere(userId?: number | null): Prisma.ServerWhereInput {
  if (userId) {
    return {
      OR: [{ isPublic: true }, { userId }],
    }
  }

  return {
    isPublic: true,
  }
}

function buildBaseWhere({
  userId,
  capability,
}: Pick<ResolveServerInput, 'userId' | 'capability'>): Prisma.ServerWhereInput {
  return {
    AND: [
      { isActive: true },
      visibilityWhere(userId),
      capabilityWhere(capability),
    ],
  }
}

export async function resolveServer({
  userId,
  serverId,
  serverName,
  capability,
}: ResolveServerInput): Promise<Server> {
  const baseWhere = buildBaseWhere({
    userId,
    capability,
  })

  if (serverId) {
    const server = await prisma.server.findFirst({
      where: {
        AND: [baseWhere, { id: serverId }],
      },
    })

    if (!server) {
      throw new Error(`Server ${serverId} was not found or is not available.`)
    }

    return server
  }

  if (serverName?.trim()) {
    const cleanName = serverName.trim()

    const server = await prisma.server.findFirst({
      where: {
        AND: [
          baseWhere,
          {
            OR: [{ title: cleanName }, { label: cleanName }],
          },
        ],
      },
    })

    if (!server) {
      throw new Error(
        `Server "${serverName}" was not found or is not available.`,
      )
    }

    return server
  }

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredArtServerId: true,
        preferredTextServerId: true,
      },
    })

    const preferredServerId =
      capability === 'text' || capability === 'chat'
        ? user?.preferredTextServerId
        : user?.preferredArtServerId

    if (preferredServerId) {
      const preferredServer = await prisma.server.findFirst({
        where: {
          AND: [baseWhere, { id: preferredServerId }],
        },
      })

      if (preferredServer) {
        return preferredServer
      }
    }
  }

  const defaultServer = await prisma.server.findFirst({
    where: {
      AND: [baseWhere, { isDefault: true }],
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })

  if (defaultServer) {
    return defaultServer
  }

  const fallbackServer = await prisma.server.findFirst({
    where: baseWhere,
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })

  if (!fallbackServer) {
    throw new Error('No available server was found for this request.')
  }

  return fallbackServer
}
