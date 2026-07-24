// /server/api/art/queue/[id]/edit.post.ts
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
} from '../../../../utils/artJobPayload'
import {
  applyArtJobOverrides,
  type ArtJobOverrides,
} from '../../../../utils/artJobRetry'
import { assessArtPrompt, cleanArtPrompt } from '../../../../utils/artPromptQuality'
import {
  buildWorkflowForEngine,
  extractRenderRequest,
  resolvePresetEngine,
} from '../../../comfy/utils/engineWorkflow'

type EditBody = {
  refreshSeed?: boolean
  preset?: string | null
  overrides?: ArtJobOverrides | null
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to edit queued ArtJobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as EditBody | null
    const source = await prisma.artJob.findUnique({ where: { id } })

    if (!source) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (!['PENDING', 'FAILED', 'CANCELLED'].includes(source.status)) {
      throw createError({
        statusCode: 409,
        message:
          source.status === 'RUNNING'
            ? 'Running jobs are already claimed. Queue an edited replacement instead.'
            : 'Completed jobs must be re-enqueued as a new output or overwrite retry.',
      })
    }

    const payload = structuredClone(parseArtJobPayload(source.payload))
    const currentRequest = extractRenderRequest(payload)
    const requestedPrompt = cleanArtPrompt(body?.overrides?.promptString)
    const prompt = requestedPrompt || currentRequest.prompt
    const promptAssessment = assessArtPrompt(prompt)

    if (!promptAssessment.useful) {
      throw createError({
        statusCode: 422,
        message: `Job cannot be queued with this prompt (${promptAssessment.reasons.join(', ')}). Describe the visible subject, setting, composition, and concrete art direction.`,
      })
    }

    const explicitSeed = body?.overrides?.seed
    const hasExplicitSeed =
      typeof explicitSeed === 'number' && Number.isFinite(explicitSeed)
    const seed = hasExplicitSeed
      ? explicitSeed
      : body?.refreshSeed === false
        ? currentRequest.seed
        : randomSeed()
    const presetEngine = resolvePresetEngine(body?.preset)

    if (presetEngine) {
      payload.workflow = buildWorkflowForEngine(presetEngine, {
        prompt,
        negativePrompt:
          typeof body?.overrides?.negativePrompt === 'string'
            ? body.overrides.negativePrompt
            : currentRequest.negativePrompt,
        width: body?.overrides?.width ?? currentRequest.width,
        height: body?.overrides?.height ?? currentRequest.height,
        seed,
      })
      payload.promptString = prompt
    }

    delete payload.curation

    const updatedPayload = applyArtJobOverrides(payload, {
      ...body?.overrides,
      promptString: prompt,
      ...(seed !== null ? { seed } : {}),
    })
    updatedPayload.queueEdit = {
      editedAt: new Date().toISOString(),
      editedByUserId: auth.user.id,
      preset: presetEngine ?? 'keep',
    }

    const updated = await prisma.artJob.update({
      where: { id },
      data: {
        engine: presetEngine ? 'COMFY' : source.engine,
        payload: serializeArtJobPayload(updatedPayload),
        status: 'PENDING',
        attempts: 0,
        claimedAt: null,
        claimedBy: null,
        error: null,
      },
    })

    return {
      success: true,
      message: `Updated job ${id} and returned it to PENDING.`,
      data: { job: decodeArtJobPayload(updated) },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to edit queued ArtJob.',
      statusCode,
    }
  }
})
