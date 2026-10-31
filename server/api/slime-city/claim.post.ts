import { defineEventHandler, readBody, createError } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { claimSlimeCityChallenge } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest)
    throw createError({ statusCode: 403, message: 'Sign in to claim rewards.' })
  const body = await readBody<{ id?: string }>(event)
  if (typeof body?.id !== 'string' || body.id.length > 80)
    throw createError({ statusCode: 400, message: 'Invalid challenge id.' })
  const data = await claimSlimeCityChallenge(auth.user.id, body.id)
  return { success: true, data }
})
