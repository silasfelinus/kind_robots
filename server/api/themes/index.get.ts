// /server/api/themes/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    console.log('[theme.get] Fetching public and user themes')

    const { isValid, user } = await validateApiKey(event)

    const includeUserThemes = isValid && user && typeof user.id === 'number'

    const themes = await prisma.theme.findMany({
      where: includeUserThemes
        ? {
            OR: [{ isPublic: true }, { userId: user.id }],
          }
        : { isPublic: true },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[theme.get] Found ${themes.length} themes`)

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserThemes
        ? `Themes retrieved for user ${user.id}`
        : 'Public themes retrieved successfully.',
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
