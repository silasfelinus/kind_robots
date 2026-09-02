import { defineEventHandler } from 'h3'
import { requireApiUser } from '@/server/utils/authGuard'
import { getKrea2QuotaStatus } from '@/server/utils/krea2Quota'

export default defineEventHandler(async (event) => {
  const auth = await requireApiUser(event)
  const quota = await getKrea2QuotaStatus(auth.user.id)

  return {
    success: true,
    quota: {
      ...quota,
      // Quota is human-owned. AgentProfile identity is useful provenance, but
      // it never changes the allowance denominator.
      sharedAcrossAgents: true,
      agentProfileId: auth.agentProfileId ?? null,
    },
  }
})
