import { createError, defineEventHandler, readBody } from 'h3'
import {
  getVideoPreset,
  type VideoEngine,
} from '../../../utils/videoPresets'

type VideoGenerateRequest = Record<string, unknown> & {
  engine?: string | null
  presetId?: string | null
  width?: number | null
  height?: number | null
  durationSeconds?: number | null
  fps?: number | null
  frameRate?: number | null
  loop?: boolean | null
  outputFormat?: string | null
}

function normalizeEngine(value: unknown): VideoEngine {
  const engine = String(value || '').trim().toLowerCase()
  if (engine === 'ltx' || engine === 'wan') return engine
  throw createError({
    statusCode: 400,
    message: 'Video generation requires engine "ltx" or "wan".',
  })
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as VideoGenerateRequest | null
  const engine = normalizeEngine(body?.engine)
  const presetId = body?.presetId?.trim() || null
  const preset = getVideoPreset(presetId)

  if (presetId && !preset) {
    throw createError({
      statusCode: 400,
      message: `Unknown video preset "${presetId}".`,
    })
  }
  if (preset && preset.engine !== engine) {
    throw createError({
      statusCode: 400,
      message: `Video preset "${preset.id}" requires engine "${preset.engine}".`,
    })
  }

  const resolvedBody: VideoGenerateRequest = {
    ...(body ?? {}),
    engine,
    presetId,
    width: body?.width ?? preset?.width,
    height: body?.height ?? preset?.height,
    durationSeconds: body?.durationSeconds ?? preset?.durationSeconds,
    fps: body?.fps ?? body?.frameRate ?? preset?.fps,
    loop: body?.loop ?? preset?.loop,
    outputFormat: body?.outputFormat ?? preset?.outputFormat,
  }

  return event.$fetch('/api/art/enqueue', {
    method: 'POST',
    body: resolvedBody,
  })
})
