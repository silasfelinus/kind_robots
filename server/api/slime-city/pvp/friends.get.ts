// GET /api/slime-city/pvp/friends: accepted friends a player can challenge.
import { defineEventHandler } from 'h3'
import { requireSlimeCityPlayer } from '~/server/utils/slimeCityProgress'
import { listSlimeCityFriends } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  return { success: true, data: await listSlimeCityFriends(auth.user.id) }
})
