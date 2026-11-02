import { createError, defineEventHandler } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { readSpaceCouchAlienGuide } from '~/server/utils/spaceCouchAlienGuide'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanApiUser(event)
    if (auth.user.isGuest)
      throw createError({ statusCode: 403, message: 'Sign in to sync your alien scrapbook.' })
    const guide = await readSpaceCouchAlienGuide(auth.user.id)
    return { success: true, data: guide }
  } catch (error) {
    const handled = errorHandler(error)
    throw createError({ statusCode: handled.statusCode ?? 500, message: handled.message })
  }
})
