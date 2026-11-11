import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'
import { joinSlimeCityDuel } from '~/server/utils/slimeCityPvp'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  const body = await readBody<{ team?: unknown }>(event)
  return {
    success: true,
    data: await joinSlimeCityDuel(id, auth.user.id, body?.team),
  }
})
