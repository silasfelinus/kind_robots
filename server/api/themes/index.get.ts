// /server/api/themes/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'

export default defineEventHandler(async (event) => {
  try {
    console.log('[theme.get] Fetching all public themes')

    const themes = await prisma.theme.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[theme.get] Found ${themes.length} public themes`)

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Public themes retrieved successfully.',
      themes,
    }
  } catch (error) {
    console.error('[theme.get] Error fetching themes:', error)

    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message,
    }
  }
})
