import { defineEventHandler, setHeader } from 'h3'
import { requireApiUser } from '@/server/utils/authGuard'
import { getFreeGenerationQuotaStatus } from '@/server/utils/freeGenerationQuota'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const auth = await requireApiUser(event)
  const quota = await getFreeGenerationQuotaStatus(auth.user.id)
  return {
    success: true,
    quota,
    agentProfileId: auth.agentProfileId ?? null,
  }
})
