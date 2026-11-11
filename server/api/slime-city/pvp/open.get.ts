// GET /api/slime-city/pvp/open: open duels any visitor can see; joining
// still needs a signed-in player.
import { defineEventHandler } from 'h3'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { listOpenSlimeCityDuels } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await getOptionalApiUser(event)
  return {
    success: true,
    data: await listOpenSlimeCityDuels(auth?.user.id ?? null),
  }
})
