import { defineEventHandler, getRouterParam } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { getSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const id = getRouterParam(event, 'id') ?? ''
  return {
    success: true,
    data: await getSlimeCityDuel(id, auth.user.id),
  }
})
