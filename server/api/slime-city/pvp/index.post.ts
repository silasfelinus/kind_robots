import { defineEventHandler, readBody } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { createSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const body = await readBody<{ team?: unknown }>(event)
  return {
    success: true,
    data: await createSlimeCityDuel(auth.user.id, body?.team),
  }
})
