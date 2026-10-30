import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser, authHasScope } from '~/server/utils/authGuard'
import { authAndGate } from '~/server/utils/comfyGate'
import {
  canonicalFusionPair,
  fusionDisplayTitle,
  starterForIdentity,
} from '~/server/utils/hybridizerFusion'
import {
  HYBRIDIZER_ART_SIZE,
  HYBRIDIZER_ART_STEPS,
  HYBRIDIZER_BATCH_MAX_PAIRS,
  HYBRIDIZER_BATCH_PENDING_CAP,
  HYBRIDIZER_BATCH_PRIORITY,
} from '~/server/utils/hybridizerArt'
import {
  buildHybridizerArtJob,
  reserveHybridizerArtJob,
} from '~/server/utils/hybridizerQueue'

type PairResult = {
  pairKey: string
  fusionId: string | null
  title: string | null
  artJobId: number | null
  status: string
  error?: string
}

// Admin-only launch catalogue seeding (hybridizer/t-007). Curated starter pairs
// become public fusions; at most HYBRIDIZER_BATCH_PENDING_CAP launch renders
// wait in the queue at once, at a priority below every other ArtJob, so the
// catalogue fills idle render time without crowding interactive or project art.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    if (!authHasScope(auth, 'generation:art'))
      throw createError({ statusCode: 403, message: 'Art scope required.' })
    const body = await readBody<{ pairs?: unknown; dryRun?: unknown }>(event)
    const dryRun = body?.dryRun === true
    if (
      !Array.isArray(body?.pairs) ||
      body.pairs.length === 0 ||
      body.pairs.length > HYBRIDIZER_BATCH_MAX_PAIRS
    )
      throw createError({
        statusCode: 400,
        message:
          'Send 1-' + HYBRIDIZER_BATCH_MAX_PAIRS + ' starter pairs per batch.',
      })

    let pending = await prisma.artJob.count({
      where: {
        projectSlug: 'hybridizer',
        priority: HYBRIDIZER_BATCH_PRIORITY,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    })
    const results: PairResult[] = []
    for (const raw of body.pairs) {
      const pairKey = Array.isArray(raw) ? raw.join('+') : String(raw)
      try {
        if (
          !Array.isArray(raw) ||
          raw.length !== 2 ||
          typeof raw[0] !== 'string' ||
          typeof raw[1] !== 'string'
        )
          throw new Error('Each pair must be two starter keys.')
        const pair = canonicalFusionPair(raw[0], raw[1])
        const left = starterForIdentity(pair.leftKey)
        const right = starterForIdentity(pair.rightKey)
        if (!left || !right)
          throw new Error('Launch hybrids combine two starter ingredients.')
        const title = fusionDisplayTitle(left.title, right.title)

        let fusion = await prisma.hybridizerFusion.findUnique({
          where: { id: pair.id },
        })
        if (fusion && !fusion.isPublic)
          throw new Error('A private fusion already owns this pair.')
        if (fusion?.artJobId) {
          const job = await prisma.artJob.findUnique({
            where: { id: fusion.artJobId },
            select: { status: true },
          })
          results.push({
            pairKey,
            fusionId: fusion.id,
            title: fusion.title,
            artJobId: fusion.artJobId,
            status: job?.status ?? 'MISSING_JOB',
          })
          continue
        }
        if (pending >= HYBRIDIZER_BATCH_PENDING_CAP) {
          results.push({
            pairKey,
            fusionId: fusion?.id ?? pair.id,
            title,
            artJobId: null,
            status: 'DEFERRED',
          })
          continue
        }
        if (dryRun) {
          buildHybridizerArtJob(
            { ...pair, isPublic: true },
            left.title,
            right.title,
            'launch-batch',
          )
          results.push({
            pairKey,
            fusionId: pair.id,
            title,
            artJobId: null,
            status: 'WOULD_QUEUE',
          })
          pending += 1
          continue
        }
        if (!fusion) {
          try {
            fusion = await prisma.hybridizerFusion.create({
              data: {
                ...pair,
                title,
                depth: 1,
                creatorUserId: auth.user.id,
                isPublic: true,
                status: 'STUDY',
              },
            })
          } catch (error) {
            if ((error as { code?: string })?.code !== 'P2002') throw error
            fusion = await prisma.hybridizerFusion.findUnique({
              where: { id: pair.id },
            })
            if (!fusion?.isPublic)
              throw new Error('A private fusion already owns this pair.', {
                cause: error,
              })
          }
        }
        const built = buildHybridizerArtJob(
          fusion,
          left.title,
          right.title,
          'launch-batch',
        )
        const gate = await authAndGate(event, {
          engine: 'comfy',
          steps: HYBRIDIZER_ART_STEPS,
          width: HYBRIDIZER_ART_SIZE,
          height: HYBRIDIZER_ART_SIZE,
        })
        const created = await reserveHybridizerArtJob(
          fusion.id,
          built,
          auth.user.id,
          HYBRIDIZER_BATCH_PRIORITY,
        )
        if (created.created) {
          await gate.commit('hybridizer-artjob:' + created.artJobId)
          pending += 1
        }
        results.push({
          pairKey,
          fusionId: fusion.id,
          title: fusion.title,
          artJobId: created.artJobId,
          status: created.created ? 'QUEUED' : 'LINKED',
        })
      } catch (error) {
        results.push({
          pairKey,
          fusionId: null,
          title: null,
          artJobId: null,
          status: 'REJECTED',
          error: error instanceof Error ? error.message : 'Invalid pair.',
        })
      }
    }
    return {
      success: true,
      data: { dryRun, pending, cap: HYBRIDIZER_BATCH_PENDING_CAP, results },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
