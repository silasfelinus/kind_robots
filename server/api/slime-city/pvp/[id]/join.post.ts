import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { joinSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const id = getRouterParam(event, 'id') ?? ''
  const body = await readBody<{ team?: unknown }>(event)
  return {
    success: true,
    data: await joinSlimeCityDuel(id, auth.user.id, body?.team),
  }
})
