// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    /*
     * Was `prisma.prompt.findMany()` with no `where` at all -- every Prompt,
     * private and mature alike, to any caller. See visibilityWhere().
     */
    const auth = await getOptionalApiUser(event)
    const data = await prisma.prompt.findMany({
      where: visibilityWhere(auth?.user, { isPublic: true, isMature: true }, auth?.isAdmin),
    })

    // Return success response with prompt details
    return {
      success: true,
      data,
      message: 'Prompts fetched successfully.',
    }
  } catch (error: unknown) {
    // Process error using errorHandler and log for debugging
    const { message, statusCode } = errorHandler(error)
    console.error(`Failed to fetch prompts: ${message}`)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: `Failed to fetch prompts: ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
