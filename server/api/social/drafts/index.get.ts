// /server/api/social/drafts/index.get.ts
//
// kind-economy/t-025: admin-only listing of SocialPostDraft rows, filterable
// by status/platform. Read-only -- no state changes here.
import { defineEventHandler, getQuery } from 'h3'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import {
  listSocialPostDrafts,
  getDailyApprovalCeilingStatus,
} from '../../../utils/socialPostDraft'
import type {
  SocialPlatform,
  SocialPostDraftStatus,
} from '~/prisma/generated/prisma/client'

const VALID_STATUSES: SocialPostDraftStatus[] = [
  'DRAFT',
  'APPROVED',
  'REJECTED',
]
const VALID_PLATFORMS: SocialPlatform[] = ['BLUESKY', 'INSTAGRAM']

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const statusParam = String(query.status || '').toUpperCase()
    const platformParam = String(query.platform || '').toUpperCase()

    const status = VALID_STATUSES.includes(statusParam as SocialPostDraftStatus)
      ? (statusParam as SocialPostDraftStatus)
      : undefined
    const platform = VALID_PLATFORMS.includes(platformParam as SocialPlatform)
      ? (platformParam as SocialPlatform)
      : undefined

    const [drafts, ceilingStatus] = await Promise.all([
      listSocialPostDrafts({ status, platform }),
      getDailyApprovalCeilingStatus(),
    ])

    return {
      success: true,
      message: 'Social post drafts loaded.',
      statusCode: 200,
      data: { drafts, ceilingStatus },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load social post drafts.',
      statusCode: event.node.res.statusCode,
    }
  }
})
