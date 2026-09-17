// /server/api/bots/count.get.ts
import { createError, defineEventHandler } from 'h3'
import { countBots } from '.'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    // Counted every Bot, so it reported private and mature ones the caller
    // could not list. Same filter as index.get.ts, so the count agrees with
    // what a viewer actually receives.
    const auth = await getOptionalApiUser(event)
    const count = await countBots(
      await visibilityWhere(
        auth?.user,
        { isPublic: true, isMature: true },
        auth?.isAdmin,
      ),
    )

    // Standardized response format
    return { success: true, data: { count } }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
