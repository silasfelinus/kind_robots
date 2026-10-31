import { defineEventHandler } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { getSlimeCityAccount } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest)
    throw createError({ statusCode: 403, message: 'Sign in to earn Slime City cards.' })
  const data = await getSlimeCityAccount(auth.user.id)
  return { success: true, data }
})
