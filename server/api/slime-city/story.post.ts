import { defineEventHandler, readBody } from 'h3'
import {
  requireSlimeCityPreviewUser,
  saveSlimeCityStory,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const body = await readBody<unknown>(event)
  return { success: true, data: await saveSlimeCityStory(auth.user.id, body) }
})
