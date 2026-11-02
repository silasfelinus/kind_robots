import { createError, defineEventHandler, readBody } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { saveSpaceCouchAlienGuide } from '~/server/utils/spaceCouchAlienGuide'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanApiUser(event)
    if (auth.user.isGuest)
      throw createError({ statusCode: 403, message: 'Sign in to sync your alien scrapbook.' })
    const body = await readBody(event)
    if (!body || typeof body !== 'object' || !('guide' in body))
      throw createError({ statusCode: 400, message: 'A scrapbook guide is required.' })
    const guide = await saveSpaceCouchAlienGuide(auth.user.id, body.guide)
    return { success: true, data: guide }
  } catch (error) {
    const handled = errorHandler(error)
    throw createError({ statusCode: handled.statusCode ?? 500, message: handled.message })
  }
})
