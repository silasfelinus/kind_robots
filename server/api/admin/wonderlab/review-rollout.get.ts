// /server/api/admin/wonderlab/review-rollout.get.ts
import { defineEventHandler, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { auditWonderLabReviewRollout } from '@/server/utils/wonderLabReviewRolloutAudit'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const audit = await auditWonderLabReviewRollout()

    return {
      success: true,
      data: audit,
      message: audit.ready
        ? 'WonderLab personality review rollout checks passed.'
        : 'WonderLab personality review rollout still has blocking checks.',
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
