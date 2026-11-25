import { defineEventHandler, setHeader } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { readConductorProjection } from '@/server/utils/conductorProjectionDb'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const stored = await readConductorProjection()
  return {
    success: true,
    data: stored?.snapshot.progressHistory ?? null,
  }
})
