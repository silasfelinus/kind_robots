import { defineEventHandler, createError } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { buySlimeCityPack } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest)
    throw createError({ statusCode: 403, message: 'Sign in to buy virtual packs.' })
  const data = await buySlimeCityPack(auth.user.id)
  return { success: true, data }
})
