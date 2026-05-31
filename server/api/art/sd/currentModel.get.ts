// /server/api/art/sd/currentModel.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { getServerEndpoint } from '@/server/utils/serverResolver'
import type { Server } from '~/prisma/generated/prisma/client'

type SDOptionsResponse = {
  sd_model_checkpoint?: string
}

function joinUrl(baseUrl: string, path: string) {
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${cleanBase}${cleanPath}`
}

function buildServerHeaders(server: Server): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const proxyToken =
    process.env.ART_SERVER_PROXY_TOKEN ||
    process.env.KINDROBOTS_SERVER_TOKEN ||
    ''

  if (proxyToken) {
    headers['X-Kindrobots-Server-Token'] = proxyToken
  }

  const serverToken = server.apiKey?.trim()

  if (!serverToken || server.authType === 'NONE') {
    return headers
  }

  if (server.authType === 'BEARER') {
    headers.Authorization = serverToken.startsWith('Bearer ')
      ? serverToken
      : `Bearer ${serverToken}`

    return headers
  }

  if (server.authType === 'HEADER' || server.authType === 'API_KEY') {
    const apiKeyName = server.apiKeyName?.trim() || 'X-API-Key'

    if (apiKeyName.toLowerCase() === 'authorization') {
      headers.Authorization = serverToken.startsWith('Bearer ')
        ? serverToken
        : `Bearer ${serverToken}`
    } else {
      headers[apiKeyName] = serverToken
    }
  }

  return headers
}

function assertA1111Server(server: Server): void {
  if (!server.isActive) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not active.`,
    })
  }

  if (server.serverType !== 'A1111') {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is ${server.serverType}. This route only supports A1111 servers.`,
    })
  }

  if (!server.baseUrl) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is missing baseUrl.`,
    })
  }
}

function getA1111OptionsUrl(server: Server): string {
  const endpoint = getServerEndpoint(server)
  const cleanEndpoint = endpoint.replace(/\/+$/, '')

  if (cleanEndpoint.endsWith('/sdapi/v1/txt2img')) {
    return cleanEndpoint.replace(/\/txt2img$/, '/options')
  }

  if (cleanEndpoint.endsWith('/sdapi/v1')) {
    return `${cleanEndpoint}/options`
  }

  if (cleanEndpoint.endsWith('/sdapi')) {
    return `${cleanEndpoint}/v1/options`
  }

  return joinUrl(server.baseUrl || '', '/sdapi/v1/options')
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const serverId = Number(query.serverId)

    const server =
      Number.isInteger(serverId) && serverId > 0
        ? await prisma.server.findUnique({
            where: {
              id: serverId,
            },
          })
        : await prisma.server.findFirst({
            where: {
              serverType: 'A1111',
              isActive: true,
              isDefault: true,
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          })

    if (!server) {
      return {
        success: false,
        data: null,
        message: 'No active A1111 server found.',
      }
    }

    assertA1111Server(server)

    const url = getA1111OptionsUrl(server)

    const res = await $fetch<SDOptionsResponse>(url, {
      method: 'GET',
      headers: buildServerHeaders(server),
      timeout: 20_000,
    })

    const modelName = res.sd_model_checkpoint?.trim()

    if (!modelName) {
      return {
        success: false,
        data: null,
        message: 'Model fetch returned no model name.',
      }
    }

    return {
      success: true,
      data: modelName,
      message: 'Current model fetched.',
    }
  } catch (error) {
    return errorHandler({
      error,
      context: 'fetching current Stable Diffusion model',
      defaultMessage: 'Failed to fetch current model.',
    })
  }
})
