// /server/api/art/queue/groups/index.get.ts
//
// Admin view of the PENDING backlog grouped by job name (the queue card's
// title): how many groups, how many jobs in each, and each group's priority
// range, ordered the way the relay will reach them.
import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireAdminApiUser } from '../../../../utils/authGuard'
import {
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
      const requested = readGalleryMaturityFilter(getQuery(event).maturity)
      if (access.showMature || requested !== 'mature') {
        const maturity = access.showMature ? requested : 'safe'
        attachArtJobGroupPreviews(
          summary,
          await loadCompletedArtJobGroupPreviewRows(auth.user.id, maturity),
        )
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
