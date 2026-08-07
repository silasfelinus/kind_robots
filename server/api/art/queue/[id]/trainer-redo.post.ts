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
  serializeArtJobPayload,
} from '../../../../utils/artJobPayload'
import {
  applyArtJobOverrides,
  prepareArtJobRetryPayload,
} from '../../../../utils/artJobRetry'
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
}

function normalizeImageData(value: unknown): string {
  const imageData = String(value || '').trim()
  if (!imageData) return ''
  return imageData.startsWith('data:image/')
    ? imageData
    : `data:image/png;base64,${imageData}`
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

    // A trainer redo deliberately rebuilds the render graph instead of merely
    // mutating the old one. That makes the two human-facing choices explicit:
    // prompt-only SDXL, or image-guided SDXL/Kontext using the finished image.
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
          imageName,
          width: renderRequest.width,
          height: renderRequest.height,
          seed: null,
        })
        prepared.images = [{ name: imageName, imageData }]
      } else {
        const imageName = `kr_trainer_sdxl_${crypto.randomUUID()}.${extension}`
        const { workflow } = buildSdxlImg2ImgWorkflow({
          prompt: promptString,
          negativePrompt: renderRequest.negativePrompt,
          imageName,
          seed: null,
          denoise: 0.55,
          originalWeight: 0.55,
        })
        prepared.workflow = workflow
        prepared.images = [{ name: imageName, imageData }]
      }
    }

    const payload = applyArtJobOverrides(prepared, { promptString })
    delete payload.resources
    payload.trainerRedo = {
      mode,
      model,
      sourceJobId: source.id,
      sourceArtImageId: source.artImageId,
      priority: 100,
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
