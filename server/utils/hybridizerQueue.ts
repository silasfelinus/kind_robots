import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { buildKrea2WorkflowFromRequest } from '~/server/api/comfy/krea2/utils/workflow'
import { normalizeQueuedArtJobPayload } from '~/server/utils/artJobNormalization'
import { repairQueuedArtSampler } from '~/server/utils/artJobSamplerRepair'
import { assertQueuedArtPromptContract } from '~/server/utils/artJobQueueSettings'
import { enrichArtJobPayload } from '~/server/utils/artJobProvenance'
import { serializeArtJobPayload } from '~/server/utils/artJobPayload'
import { starterForIdentity } from '~/server/utils/hybridizerFusion'
import {
  hybridizerArtPrompt,
  hybridizerArtSeed,
  hybridizerSubjectKind,
  HYBRIDIZER_ART_SIZE,
  HYBRIDIZER_ART_STEPS,
} from '~/server/utils/hybridizerArt'

type FusionForArt = {
  id: string
  leftKey: string
  rightKey: string
  recipeVersion: string
  isPublic: boolean
}

// Shared by the interactive enqueue route and the admin launch batch so both
// paths render the same prompt, seed, sampler and provenance for a fusion.
export function buildHybridizerArtJob(
  fusion: FusionForArt,
  leftTitle: string,
  rightTitle: string,
  origin: 'interactive' | 'launch-batch' = 'interactive',
) {
  const kind = hybridizerSubjectKind(
    starterForIdentity(fusion.leftKey)?.taxonomy,
    starterForIdentity(fusion.rightKey)?.taxonomy,
  )
  const promptString = hybridizerArtPrompt(leftTitle, rightTitle, kind)
  const { workflow } = buildKrea2WorkflowFromRequest({
    prompt: promptString,
    seed: hybridizerArtSeed(fusion.id),
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
      fusionId: fusion.id,
      leftKey: fusion.leftKey,
      rightKey: fusion.rightKey,
      recipeVersion: fusion.recipeVersion,
      retryCount: 0,
      origin,
    },
  }
  const normalized = repairQueuedArtSampler(
    'COMFY',
    normalizeQueuedArtJobPayload(initialPayload).payload,
  ).payload
  assertQueuedArtPromptContract('COMFY', normalized)
  return enrichArtJobPayload('COMFY', normalized, {
    projectSlug: 'hybridizer',
    idempotencyKey: 'fusion:' + fusion.id,
    requireCompletionProof: true,
  })
}

// Creates the ArtJob and links it to the fusion atomically. A fusion that is
// already linked (or wins a race elsewhere) returns its existing job instead.
export async function reserveHybridizerArtJob(
  fusionId: string,
  built: ReturnType<typeof buildHybridizerArtJob>,
  userId: number,
  priority: number,
): Promise<{ artJobId: number; created: boolean }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.hybridizerFusion.findUnique({
        where: { id: fusionId },
      })
      if (!current)
        throw createError({ statusCode: 404, message: 'Fusion not found.' })
      if (current.artJobId)
        return { artJobId: current.artJobId, created: false }

      const job = await tx.artJob.create({
        data: {
          engine: 'COMFY',
          payload: serializeArtJobPayload(built.payload),
          attemptFingerprint: built.provenance.attemptFingerprint,
          priority,
          projectSlug: 'hybridizer',
          userId,
        },
      })
      const reserved = await tx.hybridizerFusion.updateMany({
        where: { id: fusionId, artJobId: null },
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
    const raced = await prisma.hybridizerFusion.findUnique({
      where: { id: fusionId },
    })
    if (!raced?.artJobId) throw error
    return { artJobId: raced.artJobId, created: false }
  }
}
