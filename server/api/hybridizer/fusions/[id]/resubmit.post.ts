import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireScopedApiUser } from '~/server/utils/authGuard'
import { authAndGate } from '~/server/utils/comfyGate'
import { serializeArtJobPayload } from '~/server/utils/artJobPayload'
import {
  starterForIdentity,
  fusionIdForIdentity,
} from '~/server/utils/hybridizerFusion'
import {
  HYBRIDIZER_ACTIVE_USER_LIMIT,
  HYBRIDIZER_ART_PRIORITY,
  HYBRIDIZER_ART_SIZE,
  HYBRIDIZER_ART_STEPS,
} from '~/server/utils/hybridizerArt'
import { buildHybridizerArtJob } from '~/server/utils/hybridizerQueue'
import {
  HYBRIDIZER_MAX_VERSIONS,
  requireVisibleFusion,
  requireFusionEditor,
  versionJobs,
  versionProjectSlug,
  visibleVersionArt,
} from '~/server/utils/hybridizerVersions'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireScopedApiUser(event, 'generation:art')
    const id = getRouterParam(event, 'id') ?? ''
    const slug = versionProjectSlug(id)
    const fusion = await prisma.hybridizerFusion.findUnique({ where: { id } })
    requireVisibleFusion(fusion, auth.user.id)
    requireFusionEditor(fusion, auth.user.id, auth.isAdmin)
    if (['QUEUED', 'RENDERING', 'DELIVERING'].includes(fusion.status))
      throw createError({
        statusCode: 409,
        message: 'Finish the active artwork request before resubmitting.',
      })

    // Revisions are deliberately serialized per discovery. Never let a second
    // click start another billable render while this one is in flight.
    const jobs = await versionJobs(fusion)
    const priorArt = await visibleVersionArt(
      fusion.artImageId,
      fusion,
      auth.user.id,
    )
    if (!jobs.length || !priorArt)
      throw createError({
        statusCode: 409,
        message:
          'A delivered and accessible primary illustration is required before requesting a revision.',
      })
    if (
      jobs.some(
        (job) =>
          job.projectSlug === slug &&
          ['PENDING', 'RUNNING'].includes(job.status),
      )
    )
      throw createError({
        statusCode: 409,
        message: 'A revision is already rendering for this fusion.',
      })
    const revision = jobs.filter((job) => job.projectSlug === slug).length + 1
    if (revision >= HYBRIDIZER_MAX_VERSIONS)
      throw createError({
        statusCode: 409,
        message: 'This fusion has reached its twelve-version limit.',
      })

    const active = await prisma.artJob.count({
      where: {
        userId: auth.user.id,
        projectSlug: { startsWith: 'hybridizer' },
        status: { in: ['PENDING', 'RUNNING'] },
      },
    })
    if (active >= HYBRIDIZER_ACTIVE_USER_LIMIT)
      throw createError({
        statusCode: 429,
        message: 'Three Hybridizer renders are already active. Try later.',
      })

    async function ingredientTitle(key: string) {
      const starter = starterForIdentity(key)
      if (starter) return starter.title
      const ancestorId = fusionIdForIdentity(key)
      const ancestor = ancestorId
        ? await prisma.hybridizerFusion.findUnique({
            where: { id: ancestorId },
          })
        : null
      if (
        !ancestor ||
        (!ancestor.isPublic && ancestor.creatorUserId !== auth.user.id)
      )
        throw createError({
          statusCode: 404,
          message: 'Fusion ingredient unavailable.',
        })
      return ancestor.title
    }
    const [left, right] = await Promise.all([
      ingredientTitle(fusion.leftKey),
      ingredientTitle(fusion.rightKey),
    ])
    const built = buildHybridizerArtJob(
      fusion,
      left,
      right,
      'revision',
      revision,
    )
    const initial = jobs.find((job) => job.projectSlug === 'hybridizer')
    const originalJobId = initial?.id ?? jobs[0]!.id
    const gate = await authAndGate(event, {
      engine: 'comfy',
      steps: HYBRIDIZER_ART_STEPS,
      width: HYBRIDIZER_ART_SIZE,
      height: HYBRIDIZER_ART_SIZE,
    })

    const created = await prisma.$transaction(async (tx) => {
      // updatedAt is the optimistic reservation token: two simultaneous
      // resubmissions cannot both claim the same revision number.
      const reserved = await tx.hybridizerFusion.updateMany({
        where: { id, updatedAt: fusion.updatedAt, status: fusion.status },
        data: { updatedAt: new Date(), status: 'QUEUED' },
      })
      if (reserved.count !== 1)
        throw createError({
          statusCode: 409,
          message: 'Fusion changed. Refresh before resubmitting.',
        })
      const job = await tx.artJob.create({
        data: {
          engine: 'COMFY',
          userId: auth.user.id,
          projectSlug: slug,
          priority: HYBRIDIZER_ART_PRIORITY,
          attemptFingerprint: built.provenance.attemptFingerprint,
          payload: serializeArtJobPayload({
            ...built.payload,
            hybridizer: {
              ...(built.payload.hybridizer as Record<string, unknown>),
              originalJobId,
            },
          }),
        },
      })
      // The latest submission becomes the primary job immediately. Retain
      // the last delivered image as the preview until the new one completes.
      await tx.hybridizerFusion.update({
        where: { id },
        data: { artJobId: job.id, status: 'QUEUED' },
      })
      return job
    })
    await gate.commit('hybridizer-revision:' + created.id)
    event.node.res.statusCode = 201
    return {
      success: true,
      data: { jobId: created.id, revision, status: 'QUEUED' },
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
