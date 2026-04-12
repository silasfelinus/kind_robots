// /server/api/utils/serverResolver.ts
import { createError } from 'h3'
import prisma from '@/server/utils/prisma'
import type { Server } from '~/prisma/generated/prisma/client'

export type ServerCapability = 'art' | 'text' | 'comfy'

export interface ResolveServerInput {
  userId?: number | null
  serverId?: number | null
  serverName?: string | null
  capability?: ServerCapability
}

function normalizeUrl(baseUrl: string, endpointPath?: string | null): string {
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = endpointPath
    ? endpointPath.startsWith('/')
      ? endpointPath
      : `/${endpointPath}`
    : ''
  return `${cleanBase}${cleanPath}`
}

function supportsCapability(
  server: Server,
  capability: ServerCapability = 'text',
): boolean {
  if (!server.isActive) return false

  if (capability === 'art') {
    return (
      server.serverType === 'ART' ||
      server.serverType === 'A1111' ||
      Boolean(server.supportsTxt2Img) ||
      Boolean(server.supportsImg2Img)
    )
  }

  if (capability === 'comfy') {
    return (
      server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)
    )
  }

  return (
    server.serverType === 'TEXT' ||
    server.serverType === 'OPENAI_COMPATIBLE' ||
    Boolean(server.supportsChat)
  )
}

export async function resolveServer({
  userId = null,
  serverId = null,
  serverName = null,
  capability = 'text',
}: ResolveServerInput): Promise<Server> {
  let server: Server | null = null

  if (typeof serverId === 'number' && serverId > 0) {
    server = await prisma.server.findFirst({
      where: {
        id: serverId,
        OR: [
          { isPublic: true },
          ...(typeof userId === 'number' ? [{ userId }] : []),
        ],
      },
    })
  }

  if (!server && serverName?.trim()) {
    server = await prisma.server.findFirst({
      where: {
        title: serverName.trim(),
        OR: [
          { isPublic: true },
          ...(typeof userId === 'number' ? [{ userId }] : []),
        ],
      },
      orderBy: [{ isOfficial: 'desc' }, { isDefault: 'desc' }],
    })
  }

  if (!server && typeof userId === 'number' && capability === 'text') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredTextServerId: true },
    })

    if (typeof user?.preferredTextServerId === 'number') {
      server = await prisma.server.findFirst({
        where: {
          id: user.preferredTextServerId,
          OR: [{ isPublic: true }, { userId }],
        },
      })
    }
  }

  if (!server) {
    server = await prisma.server.findFirst({
      where: {
        isActive: true,
        ...(capability === 'text'
          ? {
              OR: [
                { isDefault: true, serverType: 'TEXT' },
                { isDefault: true, serverType: 'OPENAI_COMPATIBLE' },
                { isDefault: true, supportsChat: true },
                { isOfficial: true, serverType: 'TEXT' },
                { isOfficial: true, serverType: 'OPENAI_COMPATIBLE' },
                { isOfficial: true, supportsChat: true },
              ],
            }
          : capability === 'art'
            ? {
                OR: [
                  { isDefault: true, serverType: 'ART' },
                  { isDefault: true, serverType: 'A1111' },
                  { isDefault: true, supportsTxt2Img: true },
                  { isOfficial: true, serverType: 'ART' },
                  { isOfficial: true, serverType: 'A1111' },
                  { isOfficial: true, supportsTxt2Img: true },
                ],
              }
            : {
                OR: [
                  { isDefault: true, serverType: 'COMFY' },
                  { isDefault: true, supportsComfyWorkflow: true },
                  { isOfficial: true, serverType: 'COMFY' },
                  { isOfficial: true, supportsComfyWorkflow: true },
                ],
              }),
      },
      orderBy: [
        { isDefault: 'desc' },
        { isOfficial: 'desc' },
        { sortOrder: 'asc' },
      ],
    })
  }

  if (!server) {
    throw createError({
      statusCode: 404,
      message: `No compatible ${capability} server is available.`,
    })
  }

  if (!supportsCapability(server, capability)) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not compatible with ${capability}.`,
    })
  }

  return server
}

export function getServerEndpoint(server: Server): string {
  return normalizeUrl(server.baseUrl, server.endpointPath)
}
