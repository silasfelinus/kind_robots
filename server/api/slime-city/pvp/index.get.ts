import { defineEventHandler } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { listSlimeCityDuels } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  return { success: true, data: await listSlimeCityDuels(auth.user.id) }
})
