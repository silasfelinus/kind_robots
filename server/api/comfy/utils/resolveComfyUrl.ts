// /server/api/comfy/utils/resolveComfyUrl.ts
import { createError } from 'h3'
import prisma from '../../../utils/prisma'
import { getServerEndpoint } from '../../../utils/serverResolver'
import type { Server } from '~/prisma/generated/prisma/client'

type ResolveComfyUrlInput = {
  serverId?: number | null
  apiUrl?: string | null
}

export async function resolveComfyUrl(
  input: ResolveComfyUrlInput,
): Promise<string> {
  if (input.apiUrl?.trim()) {
    return cleanComfyBaseUrl(input.apiUrl)
  }

  if (!input.serverId) {
    throw createError({
      statusCode: 400,
      message: 'serverId or apiUrl is required.',
    })
  }

  const server = await prisma.server.findUnique({
    where: {
      id: input.serverId,
    },
  })

  if (!server || !server.isActive) {
    throw createError({
      statusCode: 404,
      message: `Server ${input.serverId} was not found or is not available.`,
    })
  }

  assertComfyServer(server)

  return cleanComfyBaseUrl(getServerEndpoint(server))
}

export async function resolveComfyBaseUrl(
  input: ResolveComfyUrlInput,
): Promise<string> {
  return await resolveComfyUrl(input)
}

export function cleanComfyBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')

  if (!trimmed) {
    throw createError({
      statusCode: 400,
      message: 'Comfy URL is required.',
    })
  }

  if (trimmed.endsWith('/prompt')) {
    return trimmed.replace(/\/prompt$/, '')
  }

  if (trimmed.endsWith('/api/prompt')) {
    return trimmed.replace(/\/api\/prompt$/, '')
  }

  return trimmed
}

function assertComfyServer(server: Server): void {
  if (server.serverType !== 'COMFY') {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is ${server.serverType}. This route only supports Comfy servers.`,
    })
  }

  if (!server.baseUrl) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is missing baseUrl.`,
    })
  }
}