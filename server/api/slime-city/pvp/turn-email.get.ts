import { defineEventHandler } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { getSlimeCityTurnPreference } from '~/server/utils/slimeCityTurnEmail'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  return { success: true, data: await getSlimeCityTurnPreference(auth.user.id) }
})
