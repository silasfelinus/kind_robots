import { defineEventHandler, readBody } from 'h3'
import {
  startSlimeCityCpuMatch,
  requireSlimeCityPreviewUser,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const body = await readBody<{
    teamId?: string
    clash?: unknown
    foeId?: unknown
  }>(event)
  const data = await startSlimeCityCpuMatch(
    auth.user.id,
    body?.teamId ?? '',
    body?.clash,
    body?.foeId,
  )
  return { success: true, data }
})
