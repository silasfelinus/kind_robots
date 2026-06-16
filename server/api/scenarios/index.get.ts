// /server/api/scenarios/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const data = await prisma.scenario.findMany({
      include: {
        Dreams: {
          select: { id: true, title: true, slug: true, dreamType: true },
        },
      },
      orderBy: { id: 'asc' },
    })

    return {
      success: true,
      message: 'All scenarios fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
