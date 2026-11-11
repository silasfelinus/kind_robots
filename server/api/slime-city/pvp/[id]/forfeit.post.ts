import { defineEventHandler, getRouterParam } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { forfeitSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const id = getRouterParam(event, 'id') ?? ''
  return {
    success: true,
    data: await forfeitSlimeCityDuel(id, auth.user.id),
  }
})
