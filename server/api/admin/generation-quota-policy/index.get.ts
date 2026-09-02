import { defineEventHandler, setHeader } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { getGenerationQuotaPolicy } from '@/server/utils/freeGenerationQuota'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  await requireAdminApiUser(event)
  return { success: true, policy: await getGenerationQuotaPolicy() }
})
