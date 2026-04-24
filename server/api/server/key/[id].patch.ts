// /server/api/server/key/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import { encryptSecret } from '@/server/utils/secretCrypto'

interface ServerKeyBody {
  apiKey?: string | null
  apiKeyName?: string | null
  clearKey?: boolean
}

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)

    if (!id || Number.isNaN(id)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid server ID.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const server = await prisma.server.findUnique({
      where: { id },
    })

    if (!server) {
      throw createError({
        statusCode: 404,
        message: 'Server not found.',
      })
    }

    const isAdmin = user.Role === 'ADMIN'

    if (server.userId !== user.id && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this server key.',
      })
    }

    const body = await readBody<ServerKeyBody>(event)

    if (body.clearKey) {
      const updated = await prisma.server.update({
        where: { id },
        data: {
          apiKey: null,
          apiKeyName: body.apiKeyName ?? server.apiKeyName,
          requiresApiKey: false,
        },
      })

      return {
        success: true,
        message: 'Server API key cleared.',
        data: {
          ...updated,
          apiKey: null,
        },
        statusCode: 200,
      }
    }

    if (!body.apiKey || !body.apiKey.trim()) {
      throw createError({
        statusCode: 400,
        message: 'API key is required.',
      })
    }

    const updated = await prisma.server.update({
      where: { id },
      data: {
        apiKey: encryptSecret(body.apiKey.trim()),
        apiKeyName: body.apiKeyName?.trim() || server.apiKeyName || 'API Key',
        requiresApiKey: true,
      },
    })

    return {
      success: true,
      message: 'Server API key saved.',
      data: {
        ...updated,
        apiKey: 'CONFIGURED',
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to update server API key.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
