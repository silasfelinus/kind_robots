// /server/api/server/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'
import type { Server } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthUser(event)
    const body = await readBody(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Server batch body must be a non-empty array.',
      })
    }

    const created: ReturnType<typeof safeServer>[] = []
    const skipped: string[] = []

    for (const item of body) {
      try {
        const safeBody =
          item && typeof item === 'object'
            ? (item as Record<string, unknown>)
            : {}

        validateServerEnums(safeBody)

        const data = buildServerCreateData(safeBody, user)
        const server: Server = await prisma.server.create({ data })
        created.push(safeServer(server, user))
      } catch (error) {
        const handled = errorHandler(error)

        if (Number(handled.statusCode) >= 500) throw error

        skipped.push(handled.message || 'Skipped invalid server.')
      }
    }

    const statusCode = created.length ? (skipped.length ? 207 : 201) : 400

    event.node.res.statusCode = statusCode

    return {
      success: created.length > 0,
      message: created.length
        ? `${created.length} servers created, ${skipped.length} skipped.`
        : 'No servers were created.',
      data: created,
      skipped,
      statusCode,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to batch-create servers.',
      data: null,
      skipped: [],
      statusCode,
    }
  }
})
