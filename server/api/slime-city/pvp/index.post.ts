import { defineEventHandler, readBody } from 'h3'
import { requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'
import { createSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const body = await readBody<{ team?: unknown }>(event)
  return {
    success: true,
    data: await createSlimeCityDuel(auth.user.id, body?.team),
  }
})
