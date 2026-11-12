// /server/api/art/queue/lookup.post.ts
//
// Map request keys (server/utils/artRequestKey.ts) back to the ArtJobs they
// created. Conductor's unrecorded-art sweep calls this with every ledger cell
// that has no job id on main, so ids a killed session or a timed-out workflow
// never committed are recovered instead of rendered twice.
//
// Deliberately lean: the queue listing returns each job's full workflow
// payload (about 70KB a job), and paging it for a recovery sweep timed out.
// This reads one indexed column and returns five fields per key.
//
// Body: { requestKeys: string[] }   (at most MAX_KEYS)
// Returns the newest job per key -- any status, so a FAILED cell is recorded
// as FAILED rather than looking unsubmitted. Keys with no job are omitted.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  artRequestKeyFingerprint,
  normalizeArtRequestKey,
} from '../../../utils/artRequestKey'

const MAX_KEYS = 500

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const body = (await readBody(event)) as { requestKeys?: unknown } | null
    const raw = body?.requestKeys
    if (!Array.isArray(raw) || raw.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'requestKeys must be a non-empty array.',
      })
    }
    if (raw.length > MAX_KEYS) {
      throw createError({
        statusCode: 400,
        message: `At most ${MAX_KEYS} requestKeys per call.`,
      })
    }

    const keyByFingerprint = new Map<string, string>()
    for (const value of raw) {
      const key = normalizeArtRequestKey(value)
      if (key) keyByFingerprint.set(artRequestKeyFingerprint(key), key)
    }

    // Own jobs only, by (userId, attemptFingerprint) -- the composite index.
    // Conductor submits and looks up as the same machine user.
    const rows = await prisma.artJob.findMany({
      where: {
        userId: auth.user.id,
        attemptFingerprint: { in: [...keyByFingerprint.keys()] },
      },
      select: {
        id: true,
        status: true,
        artImageId: true,
        projectSlug: true,
        createdAt: true,
        attemptFingerprint: true,
      },
      orderBy: { id: 'desc' },
    })

    const jobs: Array<{
      requestKey: string
      jobId: number
      status: string
      artImageId: number | null
      projectSlug: string | null
      createdAt: Date
    }> = []
    const seen = new Set<string>()
    for (const row of rows) {
      const fingerprint = row.attemptFingerprint || ''
      const requestKey = keyByFingerprint.get(fingerprint)
      if (!requestKey || seen.has(fingerprint)) continue
      seen.add(fingerprint)
      jobs.push({
        requestKey,
        jobId: row.id,
        status: row.status,
        artImageId: row.artImageId,
        projectSlug: row.projectSlug,
        createdAt: row.createdAt,
      })
    }

    return {
      success: true,
      message: `${jobs.length} of ${keyByFingerprint.size} request key(s) have a job.`,
      data: { jobs },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to look up art jobs.',
      statusCode: event.node.res.statusCode,
    }
  }
})
