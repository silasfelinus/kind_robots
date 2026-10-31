import { defineEventHandler, createError } from 'h3'
import { getSlimeCityAccount, requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const data = await getSlimeCityAccount(auth.user.id)
  return { success: true, data }
})
