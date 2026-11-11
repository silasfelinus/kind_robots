import { defineEventHandler } from 'h3'
import { requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'
import { listSlimeCityDuels } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  return { success: true, data: await listSlimeCityDuels(auth.user.id) }
})
