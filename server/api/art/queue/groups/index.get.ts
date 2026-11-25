// /server/api/art/queue/groups/index.get.ts
//
// Admin view of the PENDING backlog grouped by job name (the queue card's
// title): how many groups, how many jobs in each, and each group's priority
// range, ordered the way the relay will reach them.
import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireAdminApiUser } from '../../../../utils/authGuard'
import {
  ART_JOB_GROUP_PREVIEW_MAX_PAGES,
  ART_JOB_GROUP_PREVIEW_PAGE_SIZE,
  loadCompletedArtJobGroupPreviewRows,
  loadPendingArtJobGroupRows,
} from '../../../../utils/artJobQueueGroupRows'
import {
  getArtImageAccessContext,
  readGalleryMaturityFilter,
} from '../../../../utils/artImageAccess'
import {
  attachArtJobGroupPreviews,
  summarizeArtJobQueueGroups,
} from '~/utils/artJobQueueGroups'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)

    const summary = summarizeArtJobQueueGroups(
      await loadPendingArtJobGroupRows(),
    )

    if (summary.groups.length) {
      const access = await getArtImageAccessContext(event)
      const requested = readGalleryMaturityFilter(
        getQuery(event).maturity as string | undefined,
      )
      if (access.showMature || requested !== 'mature') {
        const maturity = access.showMature ? requested : 'safe'
        let beforeId: number | undefined
        for (let page = 0; page < ART_JOB_GROUP_PREVIEW_MAX_PAGES; page++) {
          const rows = await loadCompletedArtJobGroupPreviewRows(
            auth.user.id,
            maturity,
            beforeId,
          )
          if (!attachArtJobGroupPreviews(summary, rows)) break
          if (rows.length < ART_JOB_GROUP_PREVIEW_PAGE_SIZE) break
          beforeId = Number(rows[rows.length - 1]!.id)
        }
      }
    }

    return {
      success: true,
      message: `${summary.groups.length} pending group(s), ${summary.totalJobs} job(s).`,
      data: summary,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load art queue groups.',
      statusCode,
    }
  }
})
