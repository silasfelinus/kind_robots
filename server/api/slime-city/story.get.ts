import { defineEventHandler } from 'h3'
import {
  getSlimeCityStory,
  requireSlimeCityPlayer,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  return { success: true, data: await getSlimeCityStory(auth.user.id) }
})
