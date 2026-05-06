// /server/api/server/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthUser(event)
    const body = await readBody(event)

    if (Array.isArray(body)) {
      const created = []
      const skipped: string[] = []

      for (const item of body) {
        try {
          const data = buildServerCreateData(
            item && typeof item === 'object'
              ? (item as Record<string, unknown>)
              : {},
            user,
          )

          const server = await prisma.server.create({ data })
          created.push(safeServer(server, user))
        } catch (error) {
          skipped.push(
            error instanceof Error ? error.message : 'Skipped invalid server.',
          )
        }
      }

      event.node.res.statusCode = created.length ? 201 : 400

      return {
        success: created.length > 0,
        message: created.length
          ? 'Servers created successfully.'
          : 'No servers were created.',
        data: created,
        skipped,
      }
    }

    const data = buildServerCreateData(
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {},
      user,
    )

    const server = await prisma.server.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Server created successfully.',
      data: safeServer(server, user),
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to create server.',
    }
  }
})
