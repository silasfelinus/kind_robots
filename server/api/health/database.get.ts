// /server/api/health/database.get.ts
import { defineEventHandler, setResponseHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  setResponseHeader(event, 'Cache-Control', 'no-store')

  try {
    await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Database is reachable.',
      data: { latencyMs: Date.now() - startedAt },
      statusCode: 200,
    }
  } catch (error: unknown) {
    errorHandler(error)
    event.node.res.statusCode = 503

    return {
      success: false,
      message: 'Database is unavailable.',
      data: { latencyMs: Date.now() - startedAt },
      statusCode: 503,
    }
  }
})
