// /server/api/adverts/art/sync.post.ts
//
// Advert Studio (pages/admin/adverts.vue): register finished poster renders as
// art-slot candidates. The studio queues renders through POST /api/art/enqueue
// with projectSlug `adverts` and a requestKey `advert-studio:<slotKey>@<nonce>`
// (utils/adverts/posters.ts), which the enqueue route stores verbatim in the
// ArtJob payload. This route finds the DONE ones and adds each image to its
// slot through registerCandidates(), never choosing it: the admin picks.
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import {
  registerCandidates,
  type CandidateInput,
} from '../../../utils/artSlots'
import {
  ADVERT_PROJECT_SLUG,
  advertSlotByKey,
  slotKeyFromAdvertRequestKey,
} from '../../../../utils/adverts/posters'

const MAX_JOBS = 1000

function payloadRequestKey(payload: string): unknown {
  try {
    const parsed = JSON.parse(payload) as { requestKey?: unknown } | null
    return parsed?.requestKey ?? null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const jobs = await prisma.artJob.findMany({
      where: {
        projectSlug: ADVERT_PROJECT_SLUG,
        status: 'DONE',
        artImageId: { not: null },
      },
      select: { id: true, artImageId: true, payload: true },
      orderBy: { id: 'desc' },
      take: MAX_JOBS,
    })
    const inputs: CandidateInput[] = []
    for (const job of jobs) {
      const slotKey = slotKeyFromAdvertRequestKey(
        payloadRequestKey(job.payload),
      )
      const match = slotKey ? advertSlotByKey(slotKey) : null
      if (!slotKey || !match || !job.artImageId) continue
      inputs.push({
        slotKey,
        projectSlug: ADVERT_PROJECT_SLUG,
        label: `${match.poster.name}: ${match.slot.label}`,
        artImageId: job.artImageId,
        artJobId: job.id,
        source: 'manual',
        sourceRef: `advert-studio:artjob-${job.id}`,
        selectIfEmpty: false,
      })
    }
    const results = inputs.length
      ? await registerCandidates(inputs, auth.user.id)
      : []
    const created = results.filter((r) => r.status === 'created').length
    const missing = results.filter((r) => r.status === 'missing-image').length
    return {
      success: true,
      message: `${created} new render(s) added to advert slots.`,
      data: {
        scanned: jobs.length,
        matched: inputs.length,
        created,
        existing: results.length - created - missing,
        missing,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to sync advert renders.',
      statusCode: event.node.res.statusCode,
    }
  }
})
