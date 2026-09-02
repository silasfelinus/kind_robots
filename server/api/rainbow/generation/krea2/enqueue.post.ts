import { createError, defineEventHandler, readBody } from 'h3'
import { buildKrea2WorkflowFromRequest } from '@/server/api/comfy/krea2/utils/workflow'
import { assertArtPromptContract } from '@/server/utils/artPromptContract'
import { errorHandler } from '@/server/utils/error'
import { krea2GenerationGate } from '@/server/utils/krea2GenerationGate'

const ALLOWED_FIELDS = new Set([
  'prompt',
  'negativePrompt',
  'width',
  'height',
  'steps',
  'cfg',
  'seed',
  'sampler',
  'scheduler',
  'isPublic',
  'isMature',
])

function integerOrDefault(value: unknown, fallback: number, min: number, max: number) {
  if (value == null) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw createError({
      statusCode: 400,
      message: `Expected an integer between ${min} and ${max}.`,
    })
  }
  return parsed
}

function finiteOrDefault(value: unknown, fallback: number, min: number, max: number) {
  if (value == null) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw createError({
      statusCode: 400,
      message: `Expected a number between ${min} and ${max}.`,
    })
  }
  return parsed
}

export default defineEventHandler(async (event) => {
  try {
    const raw = (await readBody<Record<string, unknown> | null>(event)) ?? {}
    for (const key of Object.keys(raw)) {
      if (!ALLOWED_FIELDS.has(key)) {
        throw createError({
          statusCode: 400,
          message: `Unsupported Krea 2 generation field: ${key}.`,
        })
      }
    }

    const prompt = typeof raw.prompt === 'string' ? raw.prompt.trim() : ''
    if (!prompt || prompt.length > 4000) {
      throw createError({
        statusCode: 400,
        message: 'prompt is required and may contain at most 4000 characters.',
      })
    }

    const negativePrompt =
      typeof raw.negativePrompt === 'string' ? raw.negativePrompt.trim() : ''
    const width = integerOrDefault(raw.width, 1024, 256, 2048)
    const height = integerOrDefault(raw.height, 1024, 256, 2048)
    const steps = integerOrDefault(raw.steps, 8, 1, 8)
    const cfg = finiteOrDefault(raw.cfg, 1, 0, 1)
    const seed = raw.seed == null ? null : integerOrDefault(raw.seed, 0, 0, 2_147_483_647)
    const sampler = typeof raw.sampler === 'string' ? raw.sampler.trim() || null : null
    const scheduler =
      typeof raw.scheduler === 'string' ? raw.scheduler.trim() || null : null
    const isPublic = raw.isPublic !== false
    const isMature = raw.isMature === true

    assertArtPromptContract({ prompt, engine: 'krea2', steps, cfg })

    const gate = await krea2GenerationGate(event, { steps, width, height })
    const { workflow } = buildKrea2WorkflowFromRequest({
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfg,
      seed,
      sampler,
      scheduler,
      denoise: null,
      loraName: null,
      loraStrength: null,
      loras: null,
    })

    const outcome = await gate.enqueueArtJob(
      {
        engine: 'COMFY',
        payload: JSON.stringify({
          workflow,
          promptString: prompt,
          save: {
            isPublic,
            isMature,
            designer: null,
            artCollectionIds: [],
          },
          rainbowQuota: {
            requestedAt: new Date().toISOString(),
          },
        }),
        priority: 100,
        projectSlug: 'rainbow-butterflies',
        userId: gate.user.id,
      },
      'rainbow-krea2-enqueue',
    )

    event.node.res.statusCode = 201
    const message =
      outcome.quotaMode === 'DEFERRED_FREE'
        ? 'Your free Krea 2 request is queued for the next available public-capacity slot. No tokens were charged.'
        : outcome.quotaMode === 'PAID_TOKENS'
          ? 'Your daily free Krea 2 allowance is used, so this generation was queued with paid-token priority.'
          : outcome.quotaMode === 'FREE_QUOTA'
            ? 'Krea 2 generation queued using today’s shared free allowance.'
            : 'Krea 2 generation queued on free compute you control or may use.'

    return {
      success: true,
      message,
      data: {
        jobId: outcome.job.id,
        status: outcome.job.status,
        quotaMode: outcome.quotaMode,
        quota: outcome.quota,
        tokens: { charged: outcome.charged },
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to queue Krea 2 generation.',
      statusCode,
    }
  }
})
