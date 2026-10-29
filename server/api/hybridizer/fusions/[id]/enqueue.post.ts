import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireScopedApiUser } from '~/server/utils/authGuard'
import { authAndGate } from '~/server/utils/comfyGate'
import { buildKrea2WorkflowFromRequest } from '~/server/api/comfy/krea2/utils/workflow'
import { normalizeQueuedArtJobPayload } from '~/server/utils/artJobNormalization'
import { repairQueuedArtSampler } from '~/server/utils/artJobSamplerRepair'
import { assertQueuedArtPromptContract } from '~/server/utils/artJobQueueSettings'
import { enrichArtJobPayload } from '~/server/utils/artJobProvenance'
import {
  parseArtJobPayload,
  serializeArtJobPayload,
} from '~/server/utils/artJobPayload'
import {
  starterForIdentity,
  fusionIdForIdentity,
} from '~/server/utils/hybridizerFusion'
import {
  hybridizerArtPrompt,
  hybridizerArtSeed,
  HYBRIDIZER_ACTIVE_USER_LIMIT,
  HYBRIDIZER_ART_PRIORITY,
  HYBRIDIZER_ART_SIZE,
  HYBRIDIZER_ART_STEPS,
  HYBRIDIZER_RETRY_LIMIT,
} from '~/server/utils/hybridizerArt'

const activeStatuses = ['PENDING', 'RUNNING'] as const

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireScopedApiUser(event, 'generation:art')
    const id = getRouterParam(event, 'id') ?? ''
    if (!/^[a-f0-9]{64}$/.test(id))
      throw createError({
        statusCode: 400,
        message: 'Invalid fusion identifier.',
      })

    const fusion = await prisma.hybridizerFusion.findUnique({ where: { id } })
    if (!fusion || (!fusion.isPublic && fusion.creatorUserId !== auth.user.id))
      throw createError({ statusCode: 404, message: 'Fusion not available.' })

    if (fusion.artJobId) {
      const job = await prisma.artJob.findUnique({
        where: { id: fusion.artJobId },
      })
      if (!job)
        throw createError({
          statusCode: 409,
          message: 'The existing ArtJob needs repair.',
        })
      if (job.status === 'FAILED') {
        const activeRetries = await prisma.artJob.count({
          where: {
            userId: auth.user.id,
            projectSlug: 'hybridizer',
            status: { in: [...activeStatuses] },
          },
        })
        if (activeRetries >= HYBRIDIZER_ACTIVE_USER_LIMIT)
          throw createError({
            statusCode: 429,
            message:
              'You have three active Hybridizer renders. Retry after one finishes.',
          })
        if (job.userId !== auth.user.id && !auth.isAdmin)
          throw createError({
            statusCode: 409,
            message:
              'This shared fusion needs its original render requester to retry.',
          })
        const payload = parseArtJobPayload(job.payload)
        const prior =
          payload.hybridizer &&
          typeof payload.hybridizer === 'object' &&
          !Array.isArray(payload.hybridizer)
            ? (payload.hybridizer as Record<string, unknown>)
            : {}
        const retryCount = Number(prior.retryCount || 0)
        if (retryCount >= HYBRIDIZER_RETRY_LIMIT)
          throw createError({
            statusCode: 409,
            message: 'Retry limit reached. The failed ArtJob requires review.',
          })
        const changed = await prisma.artJob.updateMany({
          where: { id: job.id, status: 'FAILED' },
          data: {
            status: 'PENDING',
            attempts: 0,
            claimedAt: null,
            claimedBy: null,
            error: null,
            payload: serializeArtJobPayload({
              ...payload,
              hybridizer: { ...prior, retryCount: retryCount + 1 },
            }),
          },
        })
        if (changed.count) {
          await prisma.hybridizerFusion.update({
            where: { id },
            data: { status: 'QUEUED' },
          })
        }
        return {
          success: true,
          data: {
            key: 'fusion:' + id,
            artJobId: job.id,
            status: 'QUEUED',
            reused: true,
          },
        }
      }
      return {
        success: true,
        data: {
          key: 'fusion:' + id,
          artJobId: job.id,
          status:
            job.status === 'RUNNING'
              ? 'RENDERING'
              : job.status === 'PENDING'
                ? 'QUEUED'
                : job.status,
          reused: true,
        },
      }
    }

    const activeCount = await prisma.artJob.count({
      where: {
        userId: auth.user.id,
        projectSlug: 'hybridizer',
        status: { in: [...activeStatuses] },
      },
    })
    if (activeCount >= HYBRIDIZER_ACTIVE_USER_LIMIT)
      throw createError({
        statusCode: 429,
        message:
          'You have three active Hybridizer renders. Keep fusing while they finish.',
      })

    async function titleFor(key: string): Promise<string> {
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
          message: 'Fusion ancestor not available.',
        })
      return ancestor.title
    }
    const [left, right] = await Promise.all([
      titleFor(fusion.leftKey),
      titleFor(fusion.rightKey),
    ])
    const promptString = hybridizerArtPrompt(left, right)
    const { workflow } = buildKrea2WorkflowFromRequest({
      prompt: promptString,
      seed: hybridizerArtSeed(id),
      steps: HYBRIDIZER_ART_STEPS,
      width: HYBRIDIZER_ART_SIZE,
      height: HYBRIDIZER_ART_SIZE,
    })
    const initialPayload = {
      workflow,
      promptString,
      save: {
        isPublic: fusion.isPublic,
        isMature: false,
        designer: 'Hybridizer',
      },
      hybridizer: {
        fusionId: id,
        leftKey: fusion.leftKey,
        rightKey: fusion.rightKey,
        recipeVersion: fusion.recipeVersion,
        retryCount: 0,
      },
    }
    const normalized = repairQueuedArtSampler(
      'COMFY',
      normalizeQueuedArtJobPayload(initialPayload).payload,
    ).payload
    assertQueuedArtPromptContract('COMFY', normalized)
    const { payload, provenance } = enrichArtJobPayload('COMFY', normalized, {
      projectSlug: 'hybridizer',
      idempotencyKey: 'fusion:' + id,
      requireCompletionProof: true,
    })

    const gate = await authAndGate(event, {
      engine: 'comfy',
      steps: HYBRIDIZER_ART_STEPS,
      width: HYBRIDIZER_ART_SIZE,
      height: HYBRIDIZER_ART_SIZE,
    })
    let created
    try {
      created = await prisma.$transaction(async (tx) => {
        const current = await tx.hybridizerFusion.findUnique({ where: { id } })
        if (!current)
          throw createError({ statusCode: 404, message: 'Fusion not found.' })
        if (current.artJobId)
          return { artJobId: current.artJobId, created: false }

        const job = await tx.artJob.create({
          data: {
            engine: 'COMFY',
            payload: serializeArtJobPayload(payload),
            attemptFingerprint: provenance.attemptFingerprint,
            priority: HYBRIDIZER_ART_PRIORITY,
            projectSlug: 'hybridizer',
            userId: auth.user.id,
          },
        })
        const reserved = await tx.hybridizerFusion.updateMany({
          where: { id, artJobId: null },
          data: { artJobId: job.id, status: 'QUEUED' },
        })
        if (reserved.count !== 1)
          throw createError({
            statusCode: 409,
            message: 'Fusion is being queued elsewhere.',
          })
        return { artJobId: job.id, created: true }
      })
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode !== 409) throw error
      const raced = await prisma.hybridizerFusion.findUnique({ where: { id } })
      if (!raced?.artJobId) throw error
      created = { artJobId: raced.artJobId, created: false }
    }
    if (created.created)
      await gate.commit('hybridizer-artjob:' + created.artJobId)
    event.node.res.statusCode = created.created ? 201 : 200
    return {
      success: true,
      data: {
        key: 'fusion:' + id,
        artJobId: created.artJobId,
        status: 'QUEUED',
        reused: !created.created,
      },
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
