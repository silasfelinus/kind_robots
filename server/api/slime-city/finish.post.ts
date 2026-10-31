import { defineEventHandler, readBody } from 'h3'
import {
  finishSlimeCityCpuMatch,
  requireSlimeCityPreviewUser,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const body = await readBody<{ matchId?: string; commands?: unknown }>(event)
  const data = await finishSlimeCityCpuMatch(
    auth.user.id,
    body?.matchId ?? '',
    body?.commands,
  )
  return { success: true, data }
})
