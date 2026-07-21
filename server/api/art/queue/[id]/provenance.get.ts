// /server/api/art/queue/[id]/provenance.get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import { parseArtJobPayload } from '../../../../utils/artJobPayload'
import {
  hashArtImageData,
  readArtJobProvenance,
} from '../../../../utils/artJobProvenance'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to inspect ArtJob provenance.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const job = await prisma.artJob.findUnique({
      where: { id },
    })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    const payload = parseArtJobPayload(job.payload)
    const provenance = readArtJobProvenance(payload)
    const rawArtImage = job.artImageId
      ? await prisma.artImage.findUnique({
          where: { id: job.artImageId },
          select: {
            id: true,
            imageData: true,
            fileName: true,
            promptString: true,
            artPrompt: true,
            negativePrompt: true,
            checkpoint: true,
            sampler: true,
            seed: true,
            steps: true,
            cfg: true,
            designer: true,
            serverId: true,
            serverName: true,
            createdAt: true,
          },
        })
      : null
    const artImage = rawArtImage
      ? {
          id: rawArtImage.id,
          imageHash: hashArtImageData(rawArtImage.imageData),
          fileName: rawArtImage.fileName,
          promptString: rawArtImage.promptString,
          artPrompt: rawArtImage.artPrompt,
          negativePrompt: rawArtImage.negativePrompt,
          checkpoint: rawArtImage.checkpoint,
          sampler: rawArtImage.sampler,
          seed: rawArtImage.seed,
          steps: rawArtImage.steps,
          cfg: rawArtImage.cfg,
          designer: rawArtImage.designer,
          serverId: rawArtImage.serverId,
          serverName: rawArtImage.serverName,
          createdAt: rawArtImage.createdAt,
        }
      : null

    return {
      success: true,
      message: `ArtJob ${id} provenance loaded.`,
      statusCode: 200,
      data: {
        job: {
          id: job.id,
          status: job.status,
          engine: job.engine,
          projectSlug: job.projectSlug,
          attempts: job.attempts,
          claimedBy: job.claimedBy,
          claimedAt: job.claimedAt,
          artImageId: job.artImageId,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
        request: {
          promptString: payload.promptString || null,
          workflowTextCandidates:
            provenance?.workflowTextCandidates || [],
          promptHash: provenance?.promptHash || null,
          workflowHash: provenance?.workflowHash || null,
          workflowPromptHash: provenance?.workflowPromptHash || null,
          workflowPromptMatches: provenance?.workflowPromptMatches ?? null,
          expectedModels: provenance?.expectedModels || [],
          attemptFingerprint: provenance?.attemptFingerprint || null,
          idempotencyKey: provenance?.idempotencyKey || null,
          requireCompletionProof:
            provenance?.requireCompletionProof === true,
        },
        completion: provenance?.completion || null,
        artImage,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to inspect ArtJob provenance.',
      statusCode,
    }
  }
})
