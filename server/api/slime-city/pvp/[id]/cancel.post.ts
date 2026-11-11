// POST /api/slime-city/pvp/:id/cancel: the host withdraws a waiting duel,
// or the challenged friend declines it.
import { defineEventHandler, getRouterParam } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { cancelSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const id = getRouterParam(event, 'id') ?? ''
  return {
    success: true,
    data: await cancelSlimeCityDuel(id, auth.user.id),
  }
})
