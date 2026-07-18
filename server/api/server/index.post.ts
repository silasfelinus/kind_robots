// /server/api/server/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'

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
