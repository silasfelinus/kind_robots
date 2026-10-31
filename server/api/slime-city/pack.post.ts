import { defineEventHandler, createError } from 'h3'
import { buySlimeCityPack, requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const data = await buySlimeCityPack(auth.user.id)
  return { success: true, data }
})
