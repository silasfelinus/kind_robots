import { defineEventHandler, readBody, createError } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { finishSlimeCityCpuMatch } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest)
    throw createError({ statusCode: 403, message: 'Sign in to earn Slime City rewards.' })
  const body = await readBody<{ matchId?: string; commands?: unknown }>(event)
  const data = await finishSlimeCityCpuMatch(auth.user.id, body?.matchId ?? '', body?.commands)
  return { success: true, data }
})
