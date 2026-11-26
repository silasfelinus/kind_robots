import { defineEventHandler, readBody } from 'h3'
import {
  requireSlimeCityPlayer,
  saveSlimeCityStory,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const body = await readBody<unknown>(event)
  return { success: true, data: await saveSlimeCityStory(auth.user.id, body) }
})
