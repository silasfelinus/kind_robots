// /server/api/server/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import { assertOnlyFields } from './../../utils/chatApi'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'

// Every persisted Server column plus the identity/system/relation keys a
// round-tripped Server object can echo. Privilege columns (isOfficial,
// isDefault, isEditable, apiKey, ...) stay tolerated here but remain gated
// inside buildServerCreateData; anything outside this set is rejected (400)
// instead of silently dropped (audit F-4).
const serverCreateFields = new Set<string>([
  'title',
  'label',
  'description',
  'serverType',
  'category',
  'baseUrl',
  'endpointPath',
  'healthPath',
  'isPublic',
  'isOfficial',
  'isDefault',
  'isActive',
  'isEditable',
  'apiKeyName',
  'apiLink',
  'model',
  'apiKey',
  'designer',
  'version',
  'notes',
  'sortOrder',
  'lastCheckedAt',
  'lastStatus',
  'accessMode',
  'isMature',
  'artPrompt',
  'authType',
  // identity/system + relation keys tolerated on a round-tripped row
  'id',
  'createdAt',
  'updatedAt',
  'userId',
  'ArtImages',
  'Bots',
  'Chats',
  'Prompts',
  'user',
  'HealthChecks',
  'Resources',
])

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthUser(event)
    const body = await readBody(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/server creates one Server. Use /api/server/batch for arrays.',
      })
    }

    const safeBody =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

    validateServerEnums(safeBody)
    assertOnlyFields(safeBody, serverCreateFields, 'Server')

    const data = buildServerCreateData(safeBody, user)
    const server = await prisma.server.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Server created successfully.',
      data: safeServer(server, user),
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to create server.',
      data: null,
      statusCode,
    }
  }
})
