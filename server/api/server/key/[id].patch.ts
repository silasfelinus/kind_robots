// /server/api/server/key/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from './../../../utils/prisma'
import { errorHandler } from './../../../utils/error'
import {
  canMutateServer,
  parseId,
  readServerById,
  requireAuthUser,
  safeServer,
} from './../../../utils/serverApi'

type ServerKeyAuthType = 'NONE' | 'BEARER' | 'HEADER' | 'QUERY' | 'API_KEY'

type KeyPayload = {
  apiKey?: string | null
  apiKeyName?: string | null
  authType?: ServerKeyAuthType
  clearKey?: boolean
}

const authTypes: readonly ServerKeyAuthType[] = [
  'NONE',
  'BEARER',
  'HEADER',
  'QUERY',
  'API_KEY',
]

function cleanAuthType(value: unknown): ServerKeyAuthType | undefined {
  if (typeof value !== 'string') return undefined

  return authTypes.includes(value as ServerKeyAuthType)
    ? (value as ServerKeyAuthType)
    : undefined
}

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await requireAuthUser(event)
    const server = await readServerById(id)

    if (!canMutateServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this server API key.',
      })
    }

    if (!server.isEditable && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'This server is not editable.',
      })
    }

    const body = (await readBody(event)) as KeyPayload

    const data: {
      apiKey?: string | null
      apiKeyName?: string | null
      authType?: KeyPayload['authType']
    } = {}

    if (body.clearKey) {
      data.apiKey = null
      data.authType = 'NONE'
    } else {
      const apiKey = cleanText(body.apiKey)

      if (!apiKey) {
        throw createError({
          statusCode: 400,
          message: 'API key is required unless clearKey is true.',
        })
      }

      data.apiKey = apiKey
      data.authType =
        cleanAuthType(body.authType) || server.authType || 'API_KEY'
    }

    if ('apiKeyName' in body) {
      data.apiKeyName = cleanText(body.apiKeyName) || null
    }

    const updatedServer = await prisma.server.update({
      where: { id },
      data,
    })

    return {
      success: true,
      message: body.clearKey
        ? 'Server API key cleared.'
        : 'Server API key updated.',
      data: safeServer(updatedServer, user),
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to update server API key.',
    }
  }
})
