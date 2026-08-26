// /server/api/mandarin/sets/index.get.ts
//
// mandarin-tutor/t-016: loads the authenticated learner's custom study sets and
// queued-illustration bookkeeping (MandarinCustomSet, MandarinArtJobLink) -- the two
// pieces of `mandarinTutorStore` state that were previously `localStorage`-only, per
// that store's own deferred-follow-up comment. The client treats this as the record
// of truth and localStorage as first-load cache/offline fallback (see
// stores/mandarinTutorStore.ts's `loadCloudState`).
import { defineEventHandler } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id

    const [sets, artJobLinks] = await Promise.all([
      prisma.mandarinCustomSet.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { clientId: true, name: true, cardKeys: true, createdAt: true },
      }),
      prisma.mandarinArtJobLink.findMany({
        where: { userId },
        select: { cardKey: true, jobId: true },
      }),
    ])

    return {
      success: true,
      statusCode: 200,
      message: 'Mandarin custom sets loaded.',
      data: {
        sets: sets.map((set) => ({
          id: set.clientId,
          name: set.name,
          cardKeys: parseCardKeys(set.cardKeys),
          createdAt: set.createdAt.toISOString(),
        })),
        artJobs: Object.fromEntries(
          artJobLinks.map((link) => [link.cardKey, link.jobId]),
        ),
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load Mandarin custom sets.',
    }
  }
})

function parseCardKeys(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((key) => typeof key === 'string')
      : []
  } catch {
    return []
  }
}
