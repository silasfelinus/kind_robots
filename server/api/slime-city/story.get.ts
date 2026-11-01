import { defineEventHandler } from 'h3'
import { getSlimeCityStory, requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  return { success: true, data: await getSlimeCityStory(auth.user.id) }
})
