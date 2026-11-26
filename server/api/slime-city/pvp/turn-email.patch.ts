import { defineEventHandler, readBody } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { setSlimeCityTurnPreference } from '~/server/utils/slimeCityTurnEmail'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const body = await readBody<{ enabled?: unknown }>(event)
  return { success: true, data: await setSlimeCityTurnPreference(auth.user.id, body?.enabled) }
})
