// /server/api/themes/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'
import { parseTheme } from '@/server/api/themes/index'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    const includeUser = isValid && user?.id

    const rows = await prisma.theme.findMany({
      where: includeUser
        ? { OR: [{ isPublic: true }, { userId: user!.id }] }
        : { isPublic: true },
      orderBy: { createdAt: 'desc' },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUser
        ? `Themes retrieved for user ${user!.id}`
        : 'Public themes retrieved successfully.',
      themes: rows.map(parseTheme), // parsed values for the client/tests
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message }
  }
})
