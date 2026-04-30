// /server/utils/serverResolver.ts
import type { Server, ServerType } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

type ResolveServerCapability = 'art' | 'text' | 'chat' | 'comfy'

interface ResolveServerInput {
  userId?: number | null
  serverId?: number | null
  serverName?: string | null
  capability?: ResolveServerCapability
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
  const endpoint = joinUrl(server.baseUrl, server.endpointPath)

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
  const endpoint = joinUrl(server.baseUrl, server.endpointPath)

  if (endpoint.endsWith('/prompt')) {
    return endpoint
  }

  return `${endpoint}/prompt`
}

export function getServerEndpoint(server: Server): string {
  if (server.serverType === 'A1111') {
    return normalizeA1111Endpoint(server)
  }

  if (server.serverType === 'COMFY' || server.supportsComfyWorkflow) {
    return normalizeComfyEndpoint(server)
  }

  return joinUrl(server.baseUrl, server.endpointPath)
}

export function getServerHealthEndpoint(server: Server): string {
  if (server.healthPath) {
    return joinUrl(server.baseUrl, server.healthPath)
  }

  if (server.serverType === 'A1111') {
    return joinUrl(server.baseUrl, '/sdapi/v1/progress')
  }

  if (server.serverType === 'COMFY' || server.supportsComfyWorkflow) {
    return joinUrl(server.baseUrl, '/system_stats')
  }

  return joinUrl(server.baseUrl, server.endpointPath)
}

function capabilityWhere(capability?: ResolveServerCapability) {
  if (capability === 'art') {
    return {
      OR: [
        { serverType: 'A1111' as ServerType },
        { supportsTxt2Img: true },
        { supportsImg2Img: true },
      ],
    }
  }

  if (capability === 'comfy') {
    return {
      OR: [
        { serverType: 'COMFY' as ServerType },
        { supportsComfyWorkflow: true },
      ],
    }
  }

  if (capability === 'chat' || capability === 'text') {
    return {
      supportsChat: true,
    }
  }

  return {}
}

export async function resolveServer({
  userId,
  serverId,
  serverName,
  capability,
}: ResolveServerInput): Promise<Server> {
  const visibilityWhere = userId
    ? {
        OR: [{ isPublic: true }, { userId }],
      }
    : {
        isPublic: true,
      }

  const baseWhere = {
    isActive: true,
    ...visibilityWhere,
    ...capabilityWhere(capability),
  }

  if (serverId) {
    const server = await prisma.server.findFirst({
      where: {
        ...baseWhere,
        id: serverId,
      },
    })

    if (!server) {
      throw new Error(`Server ${serverId} was not found or is not available.`)
    }

    return server
  }

  if (serverName?.trim()) {
    const server = await prisma.server.findFirst({
      where: {
        ...baseWhere,
        OR: [{ title: serverName.trim() }, { label: serverName.trim() }],
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
      select: { preferredArtServerId: true },
    })

    if (capability === 'art' && user?.preferredArtServerId) {
      const preferredServer = await prisma.server.findFirst({
        where: {
          ...baseWhere,
          id: user.preferredArtServerId,
        },
      })

      if (preferredServer) {
        return preferredServer
      }
    }
  }

  const defaultServer = await prisma.server.findFirst({
    where: {
      ...baseWhere,
      isDefault: true,
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
