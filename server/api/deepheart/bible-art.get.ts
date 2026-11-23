import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { errorHandler } from '~/server/utils/error'
import { parseArtJobPayload } from '~/server/utils/artJobPayload'
import { COURT_DEITIES } from '~/utils/deepheart/court'
import { CHARACTERS } from '~/utils/deepheart/roster'

const REQUEST = /^deepheart-bible:(cast|court):([a-z0-9-]+):([0-9]+)$/
const castIds = new Set(CHARACTERS.map((person) => person.id))
const courtIds = new Set(COURT_DEITIES.map((deity) => deity.id))

// Browser refresh and a second device both see the same ArtJobs. ArtJob
// payloads are private; expose only the small set of fields the bible needs.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user))
      throw createError({ statusCode: 404, statusMessage: 'Not found.' })

    const rows = await prisma.artJob.findMany({
      where: {
        projectSlug: 'deepheart',
        payload: { contains: 'deepheart-bible:' },
      },
      orderBy: { id: 'desc' },
      take: 250,
      select: {
        id: true,
        status: true,
        artImageId: true,
        updatedAt: true,
        payload: true,
      },
    })
    const seen = new Set<string>()
    const jobs: Array<{
      kind: 'cast' | 'court'
      id: string
      jobId: number
      status: string
      artImageId: number | null
      updatedAt: string
    }> = []

    for (const row of rows) {
      const requestKey = parseArtJobPayload(row.payload).requestKey
      const match =
        typeof requestKey === 'string' ? REQUEST.exec(requestKey) : null
      if (!match) continue
      const kind = match[1] as 'cast' | 'court'
      const id = match[2]!
      if (
        (kind === 'cast' ? !castIds.has(id) : !courtIds.has(id)) ||
        seen.has(`${kind}:${id}`)
      ) continue
      seen.add(`${kind}:${id}`)
      jobs.push({
        kind,
        id,
        jobId: row.id,
        status: row.status,
        artImageId: row.artImageId,
        updatedAt: row.updatedAt?.toISOString() ?? '',
      })
    }
    return { success: true, data: { jobs } }
  } catch (error: unknown) {
    const result = errorHandler(error)
    event.node.res.statusCode = result.statusCode || 500
    return {
      success: false,
      message: result.message || 'Could not read Deepheart art requests.',
    }
  }
})
