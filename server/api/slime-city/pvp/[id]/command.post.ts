import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { commandSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const id = getRouterParam(event, 'id') ?? ''
  const body = await readBody<{ revision?: unknown; command?: unknown }>(event)
  return {
    success: true,
    data: await commandSlimeCityDuel(
      id,
      auth.user.id,
      body?.revision,
      body?.command,
    ),
  }
})
