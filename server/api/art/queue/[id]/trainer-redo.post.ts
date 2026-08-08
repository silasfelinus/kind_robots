// /server/api/art/queue/[id]/trainer-redo.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import {
  decodeArtJobPayload,
  parseArtJobPayload,
  serializeArtJobPayload,
  type ArtJobPayloadRecord,
} from '../../../../utils/artJobPayload'
import {
  applyArtJobOverrides,
  prepareArtJobRetryPayload,
} from '../../../../utils/artJobRetry'
import {
  resolveActiveCheckpointResourceReference,
  type ResolvedCheckpointResource,
} from '../../../../utils/artJobResourceRefresh'
import { assessArtPrompt, cleanArtPrompt } from '../../../../utils/artPromptQuality'
import {
  buildWorkflowForEngine,
  extractRenderRequest,
} from '../../../comfy/utils/engineWorkflow'
import { buildSdxlImg2ImgWorkflow } from '../../../comfy/sdxl/utils/workflow'
import {
  buildKontextWorkflow,
  getKontextImageExtension,
} from '../../../comfy/kontext/utils/workflow'

type TrainerRedoMode = 'TEXT' | 'IMG2IMG'
type TrainerRedoModel = 'SDXL' | 'KONTEXT'

type TrainerRedoBody = {
  mode?: string | null
  model?: string | null
  promptString?: string | null
  sourceImageBase64?: string | null
  checkpointResourceId?: number | null
  checkpoint?: string | null
}

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function nonEmptyString(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

function normalizeImageData(value: unknown): string {
  const imageData = String(value || '').trim()
  if (!imageData) return ''
  return imageData.startsWith('data:image/')
    ? imageData
    : `data:image/png;base64,${imageData}`
}

async function resolveTrainerCheckpoint(input: {
  body: TrainerRedoBody | null
  sourcePayload: unknown
  sourceArtImageId: number
}): Promise<ResolvedCheckpointResource> {
  const sourceImage = await prisma.artImage.findUnique({
    where: { id: input.sourceArtImageId },
    select: {
      checkpointResourceId: true,
      checkpoint: true,
    },
  })

  if (!sourceImage) {
    throw createError({
      statusCode: 409,
      message: `Source ArtImage ${input.sourceArtImageId} no longer exists.`,
    })
  }

  const sourcePayload = parseArtJobPayload(input.sourcePayload)
  const resources = asRecord(sourcePayload.resources)
  const requestedResourceId =
    Number(input.body?.checkpointResourceId) ||
    Number(sourceImage.checkpointResourceId) ||
    Number(resources.checkpointResourceId) ||
    Number(sourcePayload.checkpointResourceId) ||
    null

  const checkpoint = await resolveActiveCheckpointResourceReference({
    resourceId: requestedResourceId,
    names: [
      input.body?.checkpoint,
      sourceImage.checkpoint,
      resources.checkpointName,
      sourcePayload.checkpoint,
    ],
  })

  if (!checkpoint) {
    throw createError({
      statusCode: 409,
      message:
        'SDXL trainer revision could not resolve the requested/source checkpoint to an active CHECKPOINT Resource. Sync the checkpoint catalog or select a checkpoint Resource before retrying.',
    })
  }

  return checkpoint
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to queue trainer revisions.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as TrainerRedoBody | null
    const mode = String(body?.mode || 'TEXT').toUpperCase() as TrainerRedoMode
    const model = String(body?.model || 'SDXL').toUpperCase() as TrainerRedoModel

    if (mode !== 'TEXT' && mode !== 'IMG2IMG') {
      throw createError({
        statusCode: 400,
        message: 'mode must be TEXT or IMG2IMG.',
      })
    }
    if (model !== 'SDXL' && model !== 'KONTEXT') {
      throw createError({
        statusCode: 400,
        message: 'model must be SDXL or KONTEXT.',
      })
    }
    if (mode === 'TEXT' && model === 'KONTEXT') {
      throw createError({
        statusCode: 400,
        message: 'Kontext trainer revisions require IMG2IMG mode.',
      })
    }

    const source = await prisma.artJob.findUnique({ where: { id } })
    if (!source) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }
    if (source.status !== 'DONE' || !source.artImageId) {
      throw createError({
        statusCode: 409,
        message: 'Trainer revisions require a completed source job with an ArtImage.',
      })
    }

    const promptString = cleanArtPrompt(body?.promptString)
    const promptAssessment = assessArtPrompt(promptString)
    if (!promptAssessment.useful) {
      throw createError({
        statusCode: 422,
        message: `Trainer revision blocked because the prompt is not usable (${promptAssessment.reasons.join(', ')}).`,
      })
    }

    const checkpoint =
      model === 'SDXL'
        ? await resolveTrainerCheckpoint({
            body,
            sourcePayload: source.payload,
            sourceArtImageId: source.artImageId,
          })
        : null

    const prepared = prepareArtJobRetryPayload(
      source.payload,
      source.id,
      source.artImageId,
      'NEW_OUTPUT',
      true,
    )
    const sourceRequest = extractRenderRequest(prepared)
    const renderRequest = {
      ...sourceRequest,
      prompt: promptString,
      seed: null,
    }
    const inheritedSettings = {
      steps: finiteNumber(prepared.steps),
      cfg: finiteNumber(prepared.cfg),
      sampler: nonEmptyString(prepared.sampler),
      scheduler: nonEmptyString(prepared.scheduler),
    }

    if (mode === 'TEXT') {
      prepared.workflow = buildWorkflowForEngine('comfy', renderRequest)
      delete prepared.images
    } else {
      const imageData = normalizeImageData(body?.sourceImageBase64)
      if (!imageData) {
        throw createError({
          statusCode: 400,
          message: 'IMG2IMG trainer revisions require sourceImageBase64.',
        })
      }

      const extension = getKontextImageExtension(imageData)
      if (model === 'KONTEXT') {
        const imageName = `kr_trainer_kontext_${crypto.randomUUID()}.${extension}`
        prepared.workflow = buildKontextWorkflow({
          prompt: promptString,
          negativePrompt: renderRequest.negativePrompt,
          imageName,
          width: renderRequest.width,
          height: renderRequest.height,
          originalWeight: 0.55,
          seed: null,
        })
        prepared.images = [{ name: imageName, imageData }]
      } else {
        const imageName = `kr_trainer_sdxl_${crypto.randomUUID()}.${extension}`
        const { workflow } = buildSdxlImg2ImgWorkflow({
          prompt: promptString,
          negativePrompt: renderRequest.negativePrompt,
          imageName,
          checkpoint: checkpoint?.localPath,
          seed: null,
          originalWeight: 0.55,
        })
        prepared.workflow = workflow
        prepared.images = [{ name: imageName, imageData }]
      }
    }

    const payload = applyArtJobOverrides(prepared, {
      promptString,
      checkpoint: checkpoint?.localPath,
      ...inheritedSettings,
    })

    if (checkpoint) {
      payload.resources = {
        checkpointResourceId: checkpoint.id,
        checkpointName: checkpoint.localPath,
        loraResourceIds: [],
        loraNames: [],
      }
      payload.checkpointResourceId = checkpoint.id
    } else {
      delete payload.resources
      delete payload.checkpointResourceId
      delete payload.checkpoint
    }

    payload.trainerRedo = {
      mode,
      model,
      sourceJobId: source.id,
      sourceArtImageId: source.artImageId,
      priority: 100,
      ...(checkpoint
        ? {
            checkpointResourceId: checkpoint.id,
            checkpointName: checkpoint.localPath,
          }
        : {}),
      requestedAt: new Date().toISOString(),
    }

    const job = await prisma.artJob.create({
      data: {
        engine: 'COMFY',
        payload: serializeArtJobPayload(payload),
        priority: 100,
        projectSlug: source.projectSlug,
        projectId: source.projectId,
        userId: source.userId,
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `Queued trainer revision as ArtJob ${job.id} at priority 100.`,
      data: {
        job: decodeArtJobPayload(job),
        sourceJobId: source.id,
        sourceArtImageId: source.artImageId,
        mode,
        model,
        checkpointResourceId: checkpoint?.id ?? null,
        checkpointName: checkpoint?.localPath ?? null,
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to queue trainer revision.',
      statusCode: event.node.res.statusCode,
    }
  }
})
