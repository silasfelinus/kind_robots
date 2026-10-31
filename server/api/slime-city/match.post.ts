import { defineEventHandler, readBody, createError } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { startSlimeCityCpuMatch } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest)
    throw createError({ statusCode: 403, message: 'Sign in to fight for rewards.' })
  const body = await readBody<{ teamId?: string }>(event)
  const data = await startSlimeCityCpuMatch(auth.user.id, body?.teamId ?? '')
  return { success: true, data }
})
