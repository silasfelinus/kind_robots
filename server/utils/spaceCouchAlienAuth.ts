import { createError, type H3Event } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'

export async function requireSpaceCouchCollector(event: H3Event) {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest || auth.user.id === 10)
    throw createError({
      statusCode: 403,
      message: 'Sign in to sync your Space Couch species scrapbook.',
    })
  return auth
}
