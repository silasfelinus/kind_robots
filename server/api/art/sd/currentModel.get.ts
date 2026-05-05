// /server/api/art/sd/currentModel.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

type SDOptionsResponse = {
  sd_model_checkpoint?: string
}

function joinUrl(baseUrl: string, path: string) {
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${cleanBase}${cleanPath}`
}

function buildServerHeaders(server: {
  requiresApiKey?: boolean | null
  apiKey?: string | null
  apiKeyName?: string | null
}) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const serverToken = process.env.KINDROBOTS_SERVER_TOKEN

  if (serverToken) {
    headers['X-Kindrobots-Server-Token'] = serverToken
  }

  if (server.requiresApiKey && server.apiKey && server.apiKeyName) {
    const apiKeyName = server.apiKeyName.trim()

    if (apiKeyName.toLowerCase() === 'authorization') {
      headers.Authorization = server.apiKey.startsWith('Bearer ')
        ? server.apiKey
        : `Bearer ${server.apiKey}`
    } else {
      headers[apiKeyName] = server.apiKey
    }
  }

  return headers
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const serverId = Number(query.serverId)

    const server =
      Number.isInteger(serverId) && serverId > 0
        ? await prisma.server.findUnique({
            where: { id: serverId },
          })
        : await prisma.server.findFirst({
            where: {
              serverType: 'A1111',
              isActive: true,
              isDefault: true,
            },
            orderBy: { id: 'asc' },
          })

    if (!server?.baseUrl) {
      return {
        success: false,
        data: null,
        message: 'No active A1111 server found.',
      }
    }

    const url = joinUrl(server.baseUrl, '/sdapi/v1/options')

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
